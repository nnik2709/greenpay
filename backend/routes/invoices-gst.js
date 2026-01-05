const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');
const { generateInvoicePDF, generateVoucherPDFBuffer } = require('../utils/pdfGenerator');
const { sendInvoiceEmail, sendEmailWithAttachments } = require('../services/notificationService');
const voucherConfig = require('../config/voucherConfig');

// Import voucher PDF generation functions
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const ensureGstColumn = async () => {
  await db.query("ALTER TABLE settings ADD COLUMN IF NOT EXISTS gst_enabled boolean DEFAULT true");
};

const getEnvGstEnabled = () => {
  if (process.env.GST_ENABLED === 'false') return false;
  if (process.env.GST_ENABLED === '0') return false;
  return true;
};

const getGstEnabled = async () => {
  const fallback = getEnvGstEnabled();
  try {
    await ensureGstColumn();
    const result = await db.query('SELECT gst_enabled FROM settings ORDER BY id DESC LIMIT 1');
    if (result.rows.length === 0) return fallback;
    const val = result.rows[0].gst_enabled;
    return val === null || val === undefined ? fallback : val;
  } catch (err) {
    console.error('GST setting lookup failed, using fallback:', err.message);
    return fallback;
  }
};

// Helper function to generate vouchers PDF (same as in vouchers.js)
const generateVouchersPDF = async (vouchers, companyName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      for (let i = 0; i < vouchers.length; i++) {
        const voucher = vouchers[i];

        if (i > 0) doc.addPage();

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('PNG Green Fees', 50, 50);
        doc.fontSize(16).font('Helvetica').text('Airport Exit Voucher', 50, 80);

        // Company name
        doc.fontSize(14).font('Helvetica-Bold').text(`Company: ${companyName}`, 50, 120);

        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(voucher.voucher_code, {
          width: 300,
          margin: 2
        });
        const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
        doc.image(qrCodeBuffer, 150, 160, { width: 300 });

        // Voucher details box
        const boxY = 480;
        doc.rect(100, boxY, 400, 120).stroke();

        doc.fontSize(12).font('Helvetica-Bold').text('Voucher Code:', 120, boxY + 20);
        doc.fontSize(11).font('Helvetica').text(voucher.voucher_code, 120, boxY + 40);

        doc.fontSize(12).font('Helvetica-Bold').text(`Amount: PGK ${parseFloat(voucher.amount).toFixed(2)}`, 120, boxY + 65);
        doc.fontSize(11).font('Helvetica').text(`Valid Until: ${new Date(voucher.valid_until).toLocaleDateString()}`, 120, boxY + 85);

        // Instructions
        doc.fontSize(10).font('Helvetica-Bold').text('⚠️ IMPORTANT:', 50, 620);
        doc.fontSize(9).font('Helvetica').text('This voucher is valid for ONE airport exit only. Once scanned, it cannot be reused.', 50, 640, { width: 500 });

        doc.fontSize(10).font('Helvetica-Bold').text('Instructions:', 50, 670);
        const instructions = [
          '1. Present at airport exit',
          '2. Staff scans QR code',
          '3. System validates voucher',
          '4. Exit approved',
          '5. Voucher marked as used'
        ];
        instructions.forEach((inst, idx) => {
          doc.fontSize(9).font('Helvetica').text(inst, 50, 690 + (idx * 15));
        });

        // Footer
        doc.fontSize(8).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, 50, 770);
        doc.text(`Voucher ${i + 1} of ${vouchers.length}`, 400, 770);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate invoice number in format INV-YYYYMM-XXXX
const generateInvoiceNumber = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = 'INV';
  const yearMonth = `${year}${month}`;

  // Get the highest number for this month
  const result = await db.query(
    `SELECT invoice_number FROM invoices
     WHERE invoice_number LIKE $1
     ORDER BY invoice_number DESC
     LIMIT 1`,
    [`${prefix}-${yearMonth}-%`]
  );

  let nextNumber = 1;
  if (result.rows.length > 0) {
    const lastNumber = result.rows[0].invoice_number.split('-')[2];
    nextNumber = parseInt(lastNumber) + 1;
  }

  const paddedNumber = String(nextNumber).padStart(4, '0');
  return `${prefix}-${yearMonth}-${paddedNumber}`;
};

// Calculate GST (10% for PNG)
const calculateGST = (subtotal, gstRate = 10.00) => {
  return parseFloat((subtotal * (gstRate / 100)).toFixed(2));
};

// Safe no-op (schema-aware) voucher flag column helper
const ensureVouchersFlagColumn = async () => {
  try {
    // Attempt to add column if permissions allow; ignore errors otherwise
    await db.query("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vouchers_generated boolean DEFAULT false");
  } catch (err) {
    // Swallow permission errors; we also guard with EXISTS checks elsewhere
    console.warn('ensureVouchersFlagColumn skipped:', err.message);
  }
};

// Ensure invoices has vouchers_generated flag
// GET /api/invoices/stats - Get invoice statistics
// IMPORTANT: This must come BEFORE /:id route to avoid matching "stats" as an ID
router.get('/stats', auth, checkRole('Flex_Admin', 'Finance_Manager', 'IT_Support'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'partial') as partial_count,
        COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
        SUM(total_amount) as total_value,
        SUM(amount_paid) as total_collected,
        SUM(amount_due) as total_outstanding
      FROM invoices
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/invoices - Get all invoices
router.get('/', auth, checkRole('Flex_Admin', 'Finance_Manager', 'IT_Support'), async (req, res) => {
  try {
    const { status, customer, from_date, to_date } = req.query;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/393aee6e-ef35-424a-a035-9f1cded26861',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H2',location:'invoices-gst.js:get/ start',message:'Fetching invoices start',data:{status,customer,from_date,to_date},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    let query = `
      SELECT 
        i.*,
        EXISTS (
          SELECT 1 FROM corporate_vouchers cv WHERE cv.invoice_id = i.id
        ) AS vouchers_generated
      FROM invoices i
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND i.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (customer) {
      query += ` AND i.customer_name ILIKE $${paramCount}`;
      params.push(`%${customer}%`);
      paramCount++;
    }

    if (from_date) {
      query += ` AND i.invoice_date >= $${paramCount}`;
      params.push(from_date);
      paramCount++;
    }

    if (to_date) {
      query += ` AND i.invoice_date <= $${paramCount}`;
      params.push(to_date);
      paramCount++;
    }

    query += ' ORDER BY i.invoice_date DESC, i.invoice_number DESC';

    const result = await db.query(query, params);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/393aee6e-ef35-424a-a035-9f1cded26861',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H2',location:'invoices-gst.js:get/ success',message:'Fetched invoices ok',data:{rows:result?.rows?.length || 0},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/393aee6e-ef35-424a-a035-9f1cded26861',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H3',location:'invoices-gst.js:get/ error',message:'Error fetching invoices',data:{error:error?.message},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// GET /api/invoices/:id - Get single invoice with payments
router.get('/:id', auth, checkRole('Flex_Admin', 'Finance_Manager', 'IT_Support'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get invoice
    const invoiceResult = await db.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceResult.rows[0];

    // Ensure vouchers_generated is reflected regardless of column presence
    const vouchersExistsResult = await db.query(
      'SELECT EXISTS (SELECT 1 FROM corporate_vouchers WHERE invoice_id = $1)',
      [id]
    );
    const existsFlag = vouchersExistsResult.rows[0]?.exists || false;
    invoice.vouchers_generated = typeof invoice.vouchers_generated === 'boolean'
      ? invoice.vouchers_generated || existsFlag
      : existsFlag;

    // Get payments
    const paymentsResult = await db.query(
      'SELECT * FROM invoice_payments WHERE invoice_id = $1 ORDER BY payment_date DESC',
      [id]
    );

    invoice.payments = paymentsResult.rows;

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// GET /api/invoices/:id/vouchers - Get vouchers linked to an invoice
router.get('/:id/vouchers', auth, checkRole('Flex_Admin', 'Finance_Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const invoiceId = parseInt(id, 10);

    if (Number.isNaN(invoiceId)) {
      return res.status(400).json({ error: 'Invalid invoice id' });
    }

    // Check if invoice_id column exists in corporate_vouchers (production schema differences)
    const colCheck = await db.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'corporate_vouchers' AND column_name = 'invoice_id'`
    );

    if (colCheck.rows.length === 0) {
      return res.status(400).json({
        error: 'Vouchers are not linked to invoices in the current schema (missing invoice_id column).'
      });
    }

    const vouchersResult = await db.query(
      `SELECT * FROM corporate_vouchers
       WHERE invoice_id = $1
       ORDER BY id DESC`,
      [invoiceId]
    );

    if (vouchersResult.rows.length === 0) {
      return res.status(404).json({
        error: 'No vouchers found for this invoice'
      });
    }

    return res.json({
      success: true,
      vouchers: vouchersResult.rows
    });
  } catch (error) {
    console.error('Error fetching vouchers for invoice:', error);
    return res.status(500).json({ error: 'Failed to fetch vouchers for invoice' });
  }
});

// POST /api/invoices/from-quotation - Create invoice from quotation
router.post('/from-quotation', auth, checkRole('Flex_Admin', 'Finance_Manager'), async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const { quotation_id, due_days, payment_terms, notes, apply_gst } = req.body;

    // Get quotation
    const quotationResult = await client.query(
      'SELECT * FROM quotations WHERE id = $1',
      [quotation_id]
    );

    if (quotationResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const quotation = quotationResult.rows[0];

    // Check if already converted
    if (quotation.converted_to_invoice) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Quotation already converted to invoice' });
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Calculate dates
    const invoiceDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (due_days || 30));

    // Calculate totals (ensure all values are proper numbers) with GST toggle from request
    // Default to true if not specified for backward compatibility
    const applyGstFlag = apply_gst !== undefined ? apply_gst : true;
    const effectiveGstRate = applyGstFlag ? (quotation.gst_rate || 10.00) : 0;
    const subtotal = parseFloat(quotation.subtotal) || parseFloat((parseFloat(quotation.total_amount) / 1.10).toFixed(2));
    const gstAmount = applyGstFlag ? (parseFloat(quotation.gst_amount) || calculateGST(subtotal, effectiveGstRate)) : 0;
    const totalAmount = parseFloat((parseFloat(subtotal) + parseFloat(gstAmount)).toFixed(2));

    // Create items array from quotation
    const items = [{
      description: `Green Fee Vouchers - ${quotation.number_of_vouchers || 1} voucher${(quotation.number_of_vouchers || 1) > 1 ? 's' : ''}`,
      quantity: quotation.number_of_vouchers || 1,
      unitPrice: quotation.unit_price || (parseFloat(subtotal) / (quotation.number_of_vouchers || 1)),
      gstApplicable: true
    }];

    // Create invoice
    const invoiceResult = await client.query(
      `INSERT INTO invoices (
        invoice_number, quotation_id,
        customer_name, customer_address, customer_tin, customer_email, customer_phone,
        invoice_date, due_date, status,
        items, subtotal, gst_rate, gst_amount, net_amount, total_amount, amount_paid, amount_due,
        notes, payment_terms, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        invoiceNumber, quotation_id,
        quotation.customer_name, quotation.customer_address, quotation.customer_tin,
        quotation.customer_email, quotation.customer_phone,
        invoiceDate, dueDate, 'pending',
        JSON.stringify(items), subtotal, quotation.gst_rate || 10.00, gstAmount, subtotal, totalAmount, 0, totalAmount,
        notes || quotation.notes || quotation.description, payment_terms || 'Net 30 days', req.user.id
      ]
    );

    const invoice = invoiceResult.rows[0];

    // Update quotation
    await client.query(
      `UPDATE quotations
       SET converted_to_invoice = true,
           invoice_id = $1,
           status = 'converted'
       WHERE id = $2`,
      [invoice.id, quotation_id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  } finally {
    client.release();
  }
});

// POST /api/invoices/corporate - Create corporate invoice (unpaid) before voucher generation
router.post('/corporate', auth, checkRole('Flex_Admin', 'Finance_Manager'), async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const {
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      customer_tin,
      count,
      amount, // unit price per voucher
      discount = 0, // percentage
      valid_until
    } = req.body;

    if (!customer_name || !count || !amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'customer_name, count and amount are required' });
    }

    const quantity = parseInt(count, 10);
    const unitPrice = parseFloat(amount);
    if (Number.isNaN(quantity) || quantity < 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid voucher count' });
    }
    if (Number.isNaN(unitPrice) || unitPrice <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Calculate amounts (GST configurable)
    const gstEnabled = await getGstEnabled();
    const subtotal = quantity * unitPrice;
    const discountValue = subtotal * (parseFloat(discount) / 100);
    const subtotalAfterDiscount = subtotal - discountValue;
    const gstRate = gstEnabled ? 10.0 : 0;
    const gstAmount = gstEnabled ? calculateGST(subtotalAfterDiscount, gstRate) : 0;
    const totalAmount = subtotalAfterDiscount + gstAmount;

    // Invoice metadata
    const invoiceNumber = await generateInvoiceNumber();
    const invoiceDate = new Date();
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const items = [{
      description: `Green Fee Vouchers - ${quantity} voucher${quantity > 1 ? 's' : ''}`,
      quantity,
      unitPrice,
      gstApplicable: true
    }];

    // Use same column set as ad hoc vouchers flow to match production schema
    const invoiceResult = await client.query(
      `INSERT INTO invoices (
        invoice_number,
        customer_name,
        customer_address,
        customer_tin,
        customer_email,
        customer_phone,
        invoice_date,
        due_date,
        status,
        items,
        subtotal,
        gst_rate,
        gst_amount,
        net_amount,
        total_amount,
        amount_paid,
        amount_due,
        payment_terms,
        notes,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      )
      RETURNING *`,
      [
        invoiceNumber,
        customer_name,
        customer_address || null,
        customer_tin || null,
        customer_email || null,
        customer_phone || null,
        invoiceDate,
        dueDate,
        'pending',
        JSON.stringify(items),
        subtotalAfterDiscount,
        gstRate,
        gstAmount,
        subtotalAfterDiscount,
        totalAmount,
        0,
        totalAmount,
        'Net 30 days',
        `Corporate vouchers (pre-generation)${valid_until ? ` - Valid until ${valid_until}` : ''}`,
        req.user.id
      ]
    );

    const invoice = invoiceResult.rows[0];
    await client.query('COMMIT');

    res.json({
      success: true,
      invoice
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating corporate invoice:', error);
    res.status(500).json({ error: 'Failed to create corporate invoice' });
  } finally {
    client.release();
  }
});

// POST /api/invoices/:id/payments - Record payment
router.post('/:id/payments', auth, checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_method, payment_date, reference_number, notes } = req.body;

    // Validate payment method
    const validMethods = ['CASH', 'CARD', 'BANK TRANSFER', 'EFTPOS', 'CHEQUE', 'OTHER'];
    if (!validMethods.includes(payment_method)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Check invoice exists
    const invoiceCheck = await db.query('SELECT id, total_amount, amount_paid FROM invoices WHERE id = $1', [id]);
    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceCheck.rows[0];

    const alreadyPaid = parseFloat(invoice.amount_paid || 0);
    const total = parseFloat(invoice.total_amount || 0);
    const remaining = Math.max(total - alreadyPaid, 0);

    let payAmount = amount !== undefined ? parseFloat(amount) : remaining;
    if (Number.isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    // Clamp to remaining to avoid overpayment and ensure full settlement by default
    payAmount = Math.min(payAmount, remaining);

    // Record payment
    const result = await db.query(
      `INSERT INTO invoice_payments (invoice_id, payment_date, amount, payment_method, reference_number, notes, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, payment_date || new Date(), payAmount, payment_method, reference_number, notes, req.user.id]
    );

    // Update invoice totals/status
    const newAmountPaid = alreadyPaid + payAmount;
    const amountDue = Math.max(total - newAmountPaid, 0);
    const newStatus = amountDue <= 0.00001 ? 'paid' : 'partial';

    await db.query(
      `UPDATE invoices
       SET amount_paid = $1,
           amount_due = $2,
           status = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [newAmountPaid, amountDue, newStatus, id]
    );

    // Get updated invoice
    const updatedInvoice = await db.query('SELECT * FROM invoices WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      payment: result.rows[0],
      invoice: updatedInvoice.rows[0]
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// GET /api/invoices/:id/payments - Get payment history
router.get('/:id/payments', auth, checkRole('Flex_Admin', 'Finance_Manager', 'IT_Support', 'Counter_Agent'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM invoice_payments
       WHERE invoice_id = $1
       ORDER BY payment_date DESC, created_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// POST /api/invoices/:id/generate-vouchers - Generate vouchers (green passes) after full payment
router.post('/:id/generate-vouchers', auth, checkRole('Flex_Admin', 'Finance_Manager'), async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    await ensureVouchersFlagColumn();

    const { id } = req.params;

    // Ensure corporate_vouchers has invoice_id column to avoid 500s on insert
    const colCheck = await client.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'corporate_vouchers' AND column_name = 'invoice_id'`
    );
    if (colCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Schema missing corporate_vouchers.invoice_id; cannot link vouchers to invoice.' });
    }

    // Get invoice
    const invoiceResult = await client.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (invoiceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceResult.rows[0];

    // If flagged as already generated, return existing vouchers
    if (invoice.vouchers_generated) {
      const existing = await client.query(
        `SELECT * FROM corporate_vouchers WHERE invoice_id = $1`,
        [id]
      );
      await client.query('ROLLBACK');
      return res.json({
        success: true,
        message: 'Vouchers already generated for this invoice',
        vouchers: existing.rows
      });
    }

    // Check if fully paid
    if (invoice.status !== 'paid') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invoice must be fully paid before generating vouchers' });
    }

    // Check if vouchers already exist for this invoice (strict by invoice_id)
    const existingVouchers = await client.query(
      `SELECT * FROM corporate_vouchers WHERE invoice_id = $1`,
      [id]
    );

    if (existingVouchers.rows.length > 0) {
      await client.query('UPDATE invoices SET vouchers_generated = true, updated_at = NOW() WHERE id = $1', [id]);
      await client.query('COMMIT');
      return res.json({
        success: true,
        message: `Vouchers already exist for this invoice`,
        vouchers: existingVouchers.rows
      });
    }

    // Generate batch ID (include invoice number for tracking)
    const batchId = `INV-${invoice.invoice_number}-${Date.now()}`;

    // Parse items to get quantity (handle both array and JSON string formats)
    let items;
    try {
      items = Array.isArray(invoice.items) ? invoice.items : JSON.parse(invoice.items);
    } catch (err) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invoice items could not be parsed for voucher generation.' });
    }
    const totalVouchers = items.reduce((sum, item) => sum + item.quantity, 0);

    // Get payment method from invoice_payments if available
    let paymentMethod = 'Bank Transfer'; // Default
    const paymentResult = await client.query(
      `SELECT payment_method FROM invoice_payments 
       WHERE invoice_id = $1 
       ORDER BY payment_date DESC 
       LIMIT 1`,
      [id]
    );
    if (paymentResult.rows.length > 0) {
      paymentMethod = paymentResult.rows[0].payment_method;
    }

    // Generate vouchers (8-character alphanumeric) and link to invoice_id
    const vouchers = [];
    for (let i = 0; i < totalVouchers; i++) {
      const voucherCode = voucherConfig.helpers.generateVoucherCode('CORP');

      const voucherResult = await client.query(
        `INSERT INTO corporate_vouchers (
          voucher_code,
          company_name,
          amount,
          valid_from,
          valid_until,
          status,
          invoice_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          voucherCode,
          invoice.customer_name,
          items[0].unitPrice,
          new Date(),
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Valid for 1 year
          'pending_passport', // Requires passport registration
          id
        ]
      );

      vouchers.push(voucherResult.rows[0]);

      // Small delay to ensure unique timestamps
      if (i < totalVouchers - 1) {
        await new Promise(resolve => setTimeout(resolve, 2));
      }
    }

    // Note: Not updating invoice table as vouchers_generated/voucher_batch_id columns may not exist
    await client.query('UPDATE invoices SET vouchers_generated = true, updated_at = NOW() WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Generated ${vouchers.length} vouchers (green passes)`,
      batchId,
      vouchers
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error generating vouchers:', error);
    res.status(500).json({ error: 'Failed to generate vouchers' });
  } finally {
    client.release();
  }
});

// POST /api/invoices/:id/email - Email invoice to customer
router.post('/:id/email', auth, checkRole('Flex_Admin', 'Finance_Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { recipient_email, email } = req.body;

    // Get invoice
    const invoiceResult = await db.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceResult.rows[0];

    // Determine recipient email
    const recipientEmail = recipient_email || email || invoice.customer_email;
    if (!recipientEmail) {
      return res.status(400).json({ error: 'No recipient email address available' });
    }

    // Get customer details
    let customer = {
      name: invoice.customer_name,
      email: invoice.customer_email,
      phone: invoice.customer_phone,
      address_line1: invoice.customer_address,
      tin: invoice.customer_tin
    };

    if (invoice.customer_id) {
      const customerResult = await db.query('SELECT * FROM customers WHERE id = $1', [invoice.customer_id]);
      if (customerResult.rows.length > 0) {
        customer = customerResult.rows[0];
      }
    }

    // Get supplier details - hardcoded since settings table doesn't have key/value columns in production
    const supplier = {
      name: 'PNG Green Fees System',
      address_line1: 'Government Building',
      address_line2: 'Port Moresby',
      city: 'Port Moresby',
      province: 'National Capital District',
      postal_code: '111',
      country: 'Papua New Guinea',
      tin: 'TIN123456789',
      phone: '+675 XXX XXXX',
      email: process.env.SMTP_USER || 'noreply@greenpay.gov.pg'
    };

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice, customer, supplier);

    // Send email
    await sendInvoiceEmail({
      to: recipientEmail,
      customerName: customer.name || invoice.customer_name,
      invoiceNumber: invoice.invoice_number,
      totalAmount: invoice.total_amount,
      dueDate: invoice.due_date,
      pdfBuffer
    });

    res.json({
      success: true,
      message: `Invoice emailed successfully to ${recipientEmail}`,
      recipient: recipientEmail
    });
  } catch (error) {
    console.error('Error emailing invoice:', error);

    // Check if it's an email configuration error
    if (error.message.includes('not configured')) {
      return res.status(503).json({
        error: 'Email service not configured',
        message: 'SMTP settings need to be configured in environment variables'
      });
    }

    res.status(500).json({ error: 'Failed to email invoice' });
  }
});

// POST /api/invoices/:id/email-vouchers - Email generated vouchers to customer
router.post('/:id/email-vouchers', auth, checkRole('Flex_Admin', 'Finance_Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { recipient_email } = req.body;

    // Get invoice
    const invoiceResult = await db.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceResult.rows[0];

    // Determine recipient email
    const recipientEmail = recipient_email || invoice.customer_email;
    if (!recipientEmail) {
      return res.status(400).json({ error: 'No recipient email address available' });
    }

    // Check if invoice is paid
    if (invoice.status !== 'paid') {
      return res.status(400).json({ error: 'Invoice must be fully paid before emailing vouchers' });
    }

    // Get vouchers linked to this invoice_id
    const vouchersResult = await db.query(
      `SELECT * FROM corporate_vouchers
       WHERE invoice_id = $1
       ORDER BY voucher_code`,
      [invoice.id]
    );

    if (vouchersResult.rows.length === 0) {
      return res.status(404).json({
        error: 'No vouchers found for this invoice. Please generate vouchers first.'
      });
    }

    const vouchers = vouchersResult.rows;
    const companyName = invoice.customer_name;

    // Generate single PDF with QR codes
    const pdfBuffer = await generateVoucherPDFBuffer(vouchers, companyName);

    const policyBase = process.env.PUBLIC_URL || 'https://pnggreenfees.gov.pg';

    // Prepare email HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .voucher-summary { background: white; padding: 20px; border-left: 4px solid #059669; margin: 20px 0; }
    .important { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PNG Green Fees</h1>
      <p>Corporate Airport Exit Vouchers</p>
    </div>

    <div class="content">
      <h2>Dear ${companyName},</h2>
      <p>Your corporate airport exit vouchers are ready! Please find them attached as a PDF document.</p>

      <div class="voucher-summary">
        <strong>Voucher Summary:</strong><br>
        Invoice: ${invoice.invoice_number}<br>
        Total Vouchers: ${vouchers.length}<br>
        Valid Until: ${new Date(vouchers[0].valid_until).toLocaleDateString()}<br>
        Amount per Voucher: PGK ${parseFloat(vouchers[0].amount).toFixed(2)}
      </div>

      <div class="important">
        <strong>⚠️ Important Instructions:</strong>
        <ol>
          <li><strong>Print the attached PDF</strong> - Each voucher is on a separate page with a large QR code</li>
          <li><strong>Distribute to employees</strong> - Give each employee their voucher page</li>
          <li><strong>Present at airport exit</strong> - Show voucher QR code for scanning</li>
          <li><strong>One-time use only</strong> - Each voucher can only be used ONCE</li>
          <li><strong>Cannot be reused</strong> - Once scanned, the voucher is permanently deactivated</li>
        </ol>
      </div>

      <p>If you have any questions, please contact our support team.</p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} PNG Green Fees System. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
      <p style="margin-top:8px;">
        <a href="${policyBase}/terms" style="color:#047857;text-decoration:underline;">Terms &amp; Conditions</a> |
        <a href="${policyBase}/privacy" style="color:#047857;text-decoration:underline;">Privacy Policy</a> |
        <a href="${policyBase}/refunds" style="color:#047857;text-decoration:underline;">Refund / Return Policy</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email using notificationService
    await sendEmailWithAttachments({
      to: recipientEmail,
      subject: `${companyName} - Airport Exit Vouchers (${vouchers.length} vouchers) - Invoice ${invoice.invoice_number}`,
      html: htmlContent,
      attachments: [
        {
          filename: `${companyName.replace(/\s+/g, '_')}_Vouchers_${invoice.invoice_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    res.json({
      success: true,
      message: `${vouchers.length} vouchers emailed successfully to ${recipientEmail}`,
      voucher_count: vouchers.length
    });

  } catch (error) {
    console.error('Error emailing invoice vouchers:', error);

    if (error.response?.data) {
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(500).json({ error: 'Failed to email vouchers' });
  }
});

// GET /api/invoices/:id/vouchers-pdf - Download all vouchers for an invoice as PDF
router.get('/:id/vouchers-pdf', auth, checkRole('Flex_Admin', 'Finance_Manager', 'IT_Support', 'Counter_Agent'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get invoice
    const invoiceResult = await db.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceResult.rows[0];

    // Check if invoice is paid
    if (invoice.status !== 'paid') {
      return res.status(400).json({ error: 'Invoice must be fully paid to download vouchers' });
    }

    // Get vouchers linked to this invoice
    const vouchersResult = await db.query(
      `SELECT * FROM corporate_vouchers
       WHERE invoice_id = $1
       ORDER BY voucher_code`,
      [invoice.id]
    );

    if (vouchersResult.rows.length === 0) {
      return res.status(404).json({
        error: 'No vouchers found for this invoice. Please generate vouchers first.'
      });
    }

    const vouchers = vouchersResult.rows;
    const companyName = invoice.customer_name;

    // Generate PDF
    const pdfBuffer = await generateVoucherPDFBuffer(vouchers, companyName);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${companyName.replace(/\s+/g, '_')}_Vouchers_${invoice.invoice_number}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error downloading vouchers PDF:', error);
    res.status(500).json({ error: 'Failed to download vouchers PDF' });
  }
});

// GET /api/invoices/:id/pdf - Generate and download PDF
router.get('/:id/pdf', auth, checkRole('Flex_Admin', 'Finance_Manager', 'IT_Support'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get invoice
    const invoiceResult = await db.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceResult.rows[0];

    // Get customer details if customer_id exists
    let customer = {
      name: invoice.customer_name,
      email: invoice.customer_email,
      phone: invoice.customer_phone,
      address_line1: invoice.customer_address,
      tin: invoice.customer_tin
    };

    if (invoice.customer_id) {
      const customerResult = await db.query('SELECT * FROM customers WHERE id = $1', [invoice.customer_id]);
      if (customerResult.rows.length > 0) {
        customer = customerResult.rows[0];
      }
    }

    // Get supplier details - hardcoded since settings table doesn't have key/value columns in production
    const supplier = {
      name: 'PNG Green Fees System',
      address_line1: 'Government Building',
      address_line2: 'Port Moresby',
      city: 'Port Moresby',
      province: 'National Capital District',
      postal_code: '111',
      country: 'Papua New Guinea',
      tin: 'TIN123456789',
      phone: '+675 XXX XXXX',
      email: process.env.SMTP_USER || 'noreply@greenpay.gov.pg'
    };

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice, customer, supplier);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;
