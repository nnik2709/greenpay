const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const archiver = require('archiver');

// Email transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });
};

// Generate voucher PDF (one voucher per page)
const generateVouchersPDF = async (vouchers, companyName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Generate each voucher on a separate page
      for (let i = 0; i < vouchers.length; i++) {
        const voucher = vouchers[i];

        // Add new page for each voucher (except first)
        if (i > 0) {
          doc.addPage();
        }

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('PNG Green Fees', { align: 'center' });
        doc.fontSize(18).font('Helvetica').text('Airport Exit Voucher', { align: 'center' });
        doc.moveDown(2);

        // Company info
        doc.fontSize(14).font('Helvetica-Bold').text(`Company: ${companyName}`, { align: 'center' });
        doc.moveDown(1);

        // Generate QR code (larger for single voucher)
        const qrCodeDataUrl = await QRCode.toDataURL(voucher.voucher_code, {
          width: 300,
          margin: 2,
        });
        const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

        // Center the QR code
        const pageWidth = doc.page.width;
        const qrSize = 300;
        const qrX = (pageWidth - qrSize) / 2;

        doc.image(qrBuffer, qrX, doc.y, { width: qrSize, height: qrSize });
        doc.moveDown(18); // Move past the QR code

        // Voucher details box
        const boxWidth = 400;
        const boxX = (pageWidth - boxWidth) / 2;

        doc.rect(boxX, doc.y, boxWidth, 180).stroke();

        const textX = boxX + 20;
        let textY = doc.y + 20;

        // Voucher code
        doc.fontSize(12).font('Helvetica-Bold').text('Voucher Code:', textX, textY);
        textY += 20;
        doc.fontSize(14).font('Helvetica').fillColor('#059669').text(voucher.voucher_code, textX, textY);
        textY += 30;
        doc.fillColor('black');

        // Amount
        doc.fontSize(12).font('Helvetica-Bold').text('Amount:', textX, textY);
        textY += 20;
        doc.fontSize(14).font('Helvetica').text(`PGK ${parseFloat(voucher.amount).toFixed(2)}`, textX, textY);
        textY += 30;

        // Valid until
        doc.fontSize(12).font('Helvetica-Bold').text('Valid Until:', textX, textY);
        textY += 20;
        doc.fontSize(14).font('Helvetica').text(new Date(voucher.valid_until).toLocaleDateString(), textX, textY);

        doc.moveDown(3);

        // Important notice
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#dc2626').text('⚠️ IMPORTANT:', { align: 'center' });
        doc.fontSize(9).font('Helvetica').text('This voucher is valid for ONE airport exit only', { align: 'center' });
        doc.text('Once scanned, it cannot be reused', { align: 'center' });
        doc.fillColor('black');
        doc.moveDown(2);

        // Instructions
        doc.fontSize(10).font('Helvetica-Bold').text('Instructions:', { align: 'left' });
        doc.fontSize(9).font('Helvetica');
        doc.text('1. Present this voucher at the airport exit checkpoint');
        doc.text('2. Airport staff will scan the QR code above');
        doc.text('3. System will validate the voucher (not used, not expired)');
        doc.text('4. If valid, exit will be approved');
        doc.text('5. Voucher will be marked as used and cannot be reused');

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).fillColor('#6b7280').text(
          `Generated: ${new Date().toLocaleDateString()} | Voucher ${i + 1} of ${vouchers.length}`,
          { align: 'center' }
        );
        doc.fillColor('black');
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * GET /api/vouchers/corporate-vouchers
 * Get all corporate vouchers
 * Requires: Authentication
 */
router.get('/corporate-vouchers', auth, async (req, res) => {
  try {
    const query = `
      SELECT *
      FROM corporate_vouchers
      ORDER BY id DESC
    `;

    const result = await db.query(query);

    res.json({
      type: 'success',
      vouchers: result.rows
    });
  } catch (error) {
    console.error('Error fetching corporate vouchers:', error);
    res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Failed to fetch corporate vouchers',
      error: error.message
    });
  }
});

/**
 * Validate a voucher code (PUBLIC - no auth required for customer self-registration)
 * GET /api/vouchers/validate/:code
 */
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || !code.trim()) {
      return res.status(400).json({
        type: 'error',
        status: 'error',
        message: 'Voucher code is required.'
      });
    }

    const trimmedCode = code.trim();

    // Try individual purchases first
    const individualResult = await db.query(
      `SELECT
        id,
        voucher_code,
        passport_number,
        customer_name as full_name,
        valid_until,
        used_at,
        created_at,
        amount,
        CASE
          WHEN used_at IS NOT NULL THEN 'used'
          WHEN valid_until < NOW() THEN 'expired'
          ELSE 'active'
        END as status
      FROM individual_purchases
      WHERE voucher_code = $1`,
      [trimmedCode]
    );

    // Try corporate vouchers if not found in individual purchases
    const corporateResult = await db.query(
      `SELECT
        id,
        voucher_code,
        company_name,
        valid_until,
        redeemed_date as used_at,
        issued_date as created_at,
        amount,
        CASE
          WHEN redeemed_date IS NOT NULL THEN 'used'
          WHEN valid_until < NOW() THEN 'expired'
          ELSE 'active'
        END as status
      FROM corporate_vouchers
      WHERE voucher_code = $1`,
      [trimmedCode]
    );

    const voucherData = individualResult.rows[0] || corporateResult.rows[0];
    const voucherType = individualResult.rows[0] ? 'Individual' : corporateResult.rows[0] ? 'Corporate' : null;

    if (!voucherData) {
      return res.json({
        type: 'error',
        status: 'error',
        message: 'Voucher code not found.'
      });
    }

    // Check if voucher has been used
    if (voucherData.used_at) {
      const usedDate = new Date(voucherData.used_at).toLocaleDateString();
      return res.json({
        type: 'voucher',
        status: 'error',
        message: `${voucherType} voucher has already been used on ${usedDate}.`,
        data: { ...voucherData, voucherType }
      });
    }

    // Check if voucher has expired
    const now = new Date();
    const expiryDate = new Date(voucherData.valid_until);
    if (expiryDate < now) {
      return res.json({
        type: 'voucher',
        status: 'error',
        message: `${voucherType} voucher has expired on ${expiryDate.toLocaleDateString()}.`,
        data: { ...voucherData, voucherType }
      });
    }

    // Voucher is valid
    return res.json({
      type: 'voucher',
      status: 'success',
      message: `${voucherType} voucher is valid and ready to use!`,
      data: { ...voucherData, voucherType }
    });

  } catch (error) {
    console.error('Voucher validation error:', error);
    return res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Error validating voucher. Please try again.'
    });
  }
});

/**
 * Mark voucher as used
 * POST /api/vouchers/mark-used/:code
 */
router.post('/mark-used/:code', auth, async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Voucher code is required.' });
    }

    const trimmedCode = code.trim();

    // Try to update individual purchase
    const individualResult = await db.query(
      `UPDATE individual_purchases
       SET used_at = NOW()
       WHERE voucher_code = $1 AND used_at IS NULL
       RETURNING id, voucher_code`,
      [trimmedCode]
    );

    if (individualResult.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Individual voucher marked as used.',
        voucher: individualResult.rows[0]
      });
    }

    // Try to update corporate voucher
    const corporateResult = await db.query(
      `UPDATE corporate_vouchers
       SET redeemed_date = NOW()
       WHERE voucher_code = $1 AND redeemed_date IS NULL
       RETURNING id, voucher_code`,
      [trimmedCode]
    );

    if (corporateResult.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Corporate voucher marked as used.',
        voucher: corporateResult.rows[0]
      });
    }

    // Voucher not found or already used
    return res.status(404).json({
      error: 'Voucher not found or already used.'
    });

  } catch (error) {
    console.error('Mark voucher used error:', error);
    return res.status(500).json({
      error: 'Error marking voucher as used. Please try again.'
    });
  }
});

/**
 * Create bulk corporate vouchers
 * POST /api/vouchers/bulk-corporate
 */
router.post('/bulk-corporate', auth, checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'), async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const {
      company_name,
      count,
      amount,
      valid_from,
      valid_until
    } = req.body;

    // Validation
    if (!company_name || !count || !amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Missing required fields: company_name, count, amount'
      });
    }

    if (count < 1 || count > 1000) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Count must be between 1 and 1000'
      });
    }

    // Generate vouchers
    const vouchers = [];
    const validFrom = valid_from || new Date().toISOString();
    const validUntil = valid_until || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    for (let i = 0; i < count; i++) {
      // Generate unique voucher code
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 10).toUpperCase();
      const voucherCode = `CORP-${timestamp}-${random}`;

      const result = await client.query(
        `INSERT INTO corporate_vouchers (
          voucher_code,
          company_name,
          amount,
          valid_from,
          valid_until
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          voucherCode,
          company_name,
          amount,
          validFrom,
          validUntil
        ]
      );

      vouchers.push(result.rows[0]);

      // Small delay to ensure unique timestamps
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 2));
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Successfully created ${vouchers.length} corporate vouchers`,
      vouchers
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk corporate voucher creation error:', error);
    return res.status(500).json({
      error: 'Error creating bulk corporate vouchers'
    });
  } finally {
    client.release();
  }
});

/**
 * Email corporate vouchers to customer
 * POST /api/vouchers/email-vouchers
 */
router.post('/email-vouchers', auth, checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'), async (req, res) => {
  try {
    const { voucher_ids, company_name, recipient_email } = req.body;

    // Validation
    if (!voucher_ids || !Array.isArray(voucher_ids) || voucher_ids.length === 0) {
      return res.status(400).json({ error: 'Voucher IDs are required' });
    }

    if (!recipient_email) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    // Get vouchers
    const result = await db.query(
      'SELECT * FROM corporate_vouchers WHERE id = ANY($1) ORDER BY voucher_code',
      [voucher_ids]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No vouchers found' });
    }

    const vouchers = result.rows;
    const companyName = company_name || vouchers[0].company_name;

    // Generate PDF
    const pdfBuffer = await generateVouchersPDF(vouchers, companyName);

    // Send email
    const transporter = createTransporter();
    if (!transporter) {
      return res.status(503).json({
        error: 'Email service not configured',
        message: 'SMTP settings need to be configured'
      });
    }

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

      <p><strong>How to Use:</strong></p>
      <ul>
        <li>Employee presents voucher at airport exit checkpoint</li>
        <li>Airport staff scans the QR code</li>
        <li>System validates the voucher (checks if not already used and not expired)</li>
        <li>If valid, exit is approved and voucher is marked as used</li>
      </ul>

      <p>If you have any questions, please contact our support team.</p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} PNG Green Fees System. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"PNG Green Fees" <noreply@greenpay.eywademo.cloud>',
      to: recipient_email,
      subject: `${companyName} - Airport Exit Vouchers (${vouchers.length} vouchers)`,
      html: htmlContent,
      attachments: [
        {
          filename: `${companyName.replace(/\s+/g, '_')}_Vouchers_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: `Vouchers emailed successfully to ${recipient_email}`,
      voucher_count: vouchers.length
    });

  } catch (error) {
    console.error('Error emailing vouchers:', error);
    res.status(500).json({ error: 'Failed to email vouchers' });
  }
});

/**
 * Download batch as ZIP file
 * GET /api/vouchers/download-batch/:batchId
 */
router.get('/download-batch/:batchId', auth, checkRole('Flex_Admin', 'Finance_Manager', 'IT_Support', 'Counter_Agent'), async (req, res) => {
  try {
    const { batchId } = req.params;

    // Get all vouchers in the batch
    const result = await db.query(
      'SELECT * FROM corporate_vouchers WHERE batch_id = $1 ORDER BY voucher_code',
      [batchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No vouchers found in this batch' });
    }

    const vouchers = result.rows;
    const companyName = vouchers[0].company_name || 'Company';
    const batchName = `${companyName.replace(/\s+/g, '_')}_Batch_${batchId}`;

    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${batchName}.zip"`);

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).json({ error: 'Error creating ZIP archive' });
    });

    // Pipe archive to response
    archive.pipe(res);

    // Generate and add each voucher as a separate PDF
    for (let i = 0; i < vouchers.length; i++) {
      const voucher = vouchers[i];
      const pdfBuffer = await generateVouchersPDF([voucher], companyName);

      // Add PDF to archive with voucher code as filename
      archive.append(pdfBuffer, {
        name: `Voucher_${voucher.voucher_code}.pdf`
      });
    }

    // Finalize the archive
    await archive.finalize();

  } catch (error) {
    console.error('Error downloading batch:', error);
    res.status(500).json({ error: 'Failed to download batch' });
  }
});

/**
 * Email entire batch to company
 * POST /api/vouchers/email-batch
 */
router.post('/email-batch', auth, checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'), async (req, res) => {
  try {
    const { batch_id, recipient_email } = req.body;

    // Validation
    if (!batch_id) {
      return res.status(400).json({ error: 'Batch ID is required' });
    }

    if (!recipient_email) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    // Get all vouchers in the batch
    const result = await db.query(
      'SELECT * FROM corporate_vouchers WHERE batch_id = $1 ORDER BY voucher_code',
      [batch_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No vouchers found in this batch' });
    }

    const vouchers = result.rows;
    const companyName = vouchers[0].company_name || 'Company';

    // Generate single PDF with all vouchers
    const pdfBuffer = await generateVouchersPDF(vouchers, companyName);

    // Send email
    const transporter = createTransporter();
    if (!transporter) {
      return res.status(503).json({
        error: 'Email service not configured',
        message: 'SMTP settings need to be configured'
      });
    }

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
      <p>Corporate Airport Exit Vouchers - Batch ${batch_id}</p>
    </div>

    <div class="content">
      <h2>Dear ${companyName},</h2>
      <p>Your corporate airport exit vouchers batch is ready! Please find all vouchers attached as a single PDF document.</p>

      <div class="voucher-summary">
        <strong>Batch Summary:</strong><br>
        Batch ID: ${batch_id}<br>
        Total Vouchers: ${vouchers.length}<br>
        Valid Until: ${new Date(vouchers[0].valid_until).toLocaleDateString()}<br>
        Amount per Voucher: PGK ${parseFloat(vouchers[0].amount).toFixed(2)}<br>
        Total Value: PGK ${(parseFloat(vouchers[0].amount) * vouchers.length).toFixed(2)}
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

      <p><strong>How to Use:</strong></p>
      <ul>
        <li>Employee presents voucher at airport exit checkpoint</li>
        <li>Airport staff scans the QR code</li>
        <li>System validates the voucher (checks if not already used and not expired)</li>
        <li>If valid, exit is approved and voucher is marked as used</li>
      </ul>

      <p>If you have any questions, please contact our support team.</p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} PNG Green Fees System. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"PNG Green Fees" <noreply@greenpay.eywademo.cloud>',
      to: recipient_email,
      subject: `${companyName} - Batch ${batch_id} Airport Exit Vouchers (${vouchers.length} vouchers)`,
      html: htmlContent,
      attachments: [
        {
          filename: `${companyName.replace(/\s+/g, '_')}_Batch_${batch_id}_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: `Batch ${batch_id} emailed successfully to ${recipient_email}`,
      voucher_count: vouchers.length
    });

  } catch (error) {
    console.error('Error emailing batch:', error);
    res.status(500).json({ error: 'Failed to email batch' });
  }
});

module.exports = router;
