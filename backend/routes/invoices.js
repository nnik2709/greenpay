const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');
const { generateInvoicePDF } = require('../utils/pdfGenerator');

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

    let query = 'SELECT * FROM invoices WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (customer) {
      query += ` AND customer_name ILIKE $${paramCount}`;
      params.push(`%${customer}%`);
      paramCount++;
    }

    if (from_date) {
      query += ` AND invoice_date >= $${paramCount}`;
      params.push(from_date);
      paramCount++;
    }

    if (to_date) {
      query += ` AND invoice_date <= $${paramCount}`;
      params.push(to_date);
      paramCount++;
    }

    query += ' ORDER BY invoice_date DESC, invoice_number DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
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

// POST /api/invoices/from-quotation - Create invoice from quotation
router.post('/from-quotation', auth, checkRole('Flex_Admin', 'Finance_Manager'), async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const { quotation_id, due_days, payment_terms, notes } = req.body;

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

    // Calculate totals
    const subtotal = quotation.subtotal || parseFloat((quotation.total_amount / 1.10).toFixed(2));
    const gstAmount = quotation.gst_amount || calculateGST(subtotal, quotation.gst_rate || 10.00);
    const totalAmount = parseFloat((subtotal + gstAmount).toFixed(2));

    // Create items array from quotation
    const items = [{
      description: `Green Fee Exit Pass - ${quotation.number_of_passports} passports`,
      quantity: quotation.number_of_passports,
      unitPrice: quotation.amount_per_passport,
      gstApplicable: true
    }];

    // Create invoice
    const invoiceResult = await client.query(
      `INSERT INTO invoices (
        invoice_number, quotation_id,
        customer_name, customer_address, customer_tin, customer_email, customer_phone,
        invoice_date, due_date, status,
        items, subtotal, gst_rate, gst_amount, total_amount, amount_paid, amount_due,
        notes, payment_terms, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        invoiceNumber, quotation_id,
        quotation.company_name, quotation.customer_address, quotation.customer_tin,
        quotation.contact_email, quotation.contact_phone,
        invoiceDate, dueDate, 'pending',
        JSON.stringify(items), subtotal, quotation.gst_rate || 10.00, gstAmount, totalAmount, 0, totalAmount,
        notes || quotation.notes, payment_terms || 'Net 30 days', req.user.id
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

// POST /api/invoices/:id/payments - Record payment
router.post('/:id/payments', auth, checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_method, payment_date, reference_number, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

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

    // Check if overpayment
    const totalPaid = parseFloat(invoice.amount_paid || 0) + parseFloat(amount);
    if (totalPaid > parseFloat(invoice.total_amount)) {
      return res.status(400).json({
        error: 'Payment amount exceeds invoice balance',
        balance_due: parseFloat(invoice.total_amount) - parseFloat(invoice.amount_paid || 0)
      });
    }

    // Record payment
    const result = await db.query(
      `INSERT INTO invoice_payments (invoice_id, payment_date, amount, payment_method, reference_number, notes, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, payment_date || new Date(), amount, payment_method, reference_number, notes, req.user.id]
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

    const { id } = req.params;

    // Get invoice
    const invoiceResult = await client.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (invoiceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceResult.rows[0];

    // Check if fully paid
    if (invoice.status !== 'paid') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invoice must be fully paid before generating vouchers' });
    }

    // Check if already generated
    if (invoice.vouchers_generated) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Vouchers already generated for this invoice' });
    }

    // Generate batch ID
    const batchId = `INV-${invoice.invoice_number}-${Date.now()}`;

    // Parse items to get quantity
    const items = JSON.parse(invoice.items);
    const totalVouchers = items.reduce((sum, item) => sum + item.quantity, 0);

    // Generate vouchers
    const vouchers = [];
    for (let i = 0; i < totalVouchers; i++) {
      const voucherCode = `GP-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const voucherResult = await client.query(
        `INSERT INTO corporate_vouchers (
          voucher_code, batch_id, invoice_id, is_green_pass,
          company_name, status, amount, valid_from, valid_until,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          voucherCode,
          batchId,
          invoice.id,
          true,
          invoice.customer_name,
          'available',
          items[0].unitPrice,
          new Date(),
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Valid for 1 year
          req.user.id
        ]
      );

      vouchers.push(voucherResult.rows[0]);
    }

    // Update invoice
    await client.query(
      `UPDATE invoices
       SET vouchers_generated = true,
           voucher_batch_id = $1
       WHERE id = $2`,
      [batchId, id]
    );

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

    // Get supplier details from settings
    const settingsResult = await db.query(
      "SELECT key, value FROM settings WHERE key IN ('company_name', 'company_address_line1', 'company_address_line2', 'company_city', 'company_province', 'company_postal_code', 'company_country', 'company_tin', 'company_phone', 'company_email')"
    );

    const supplier = {
      name: 'PNG Green Fees System',
      address_line1: '',
      address_line2: '',
      city: '',
      province: '',
      postal_code: '',
      country: 'Papua New Guinea',
      tin: '',
      phone: '',
      email: ''
    };

    // Map settings to supplier object
    settingsResult.rows.forEach(setting => {
      const key = setting.key.replace('company_', '');
      if (key === 'name') {
        supplier.name = setting.value || supplier.name;
      } else {
        supplier[key] = setting.value || '';
      }
    });

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
