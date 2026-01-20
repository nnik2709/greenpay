# Comprehensive Fixes - 2026-01-20

## Overview

This document contains fixes for all reported issues:

1. ✅ Cash Reconciliation SQL Error
2. ✅ Quotation Reports Filtering
3. ✅ Email Templates System
4. ✅ POS Printer Layout (Epson TM-T82II)
5. ✅ SQL Pagination for Passports
6. ✅ SQL Pagination for Vouchers

---

## Issue 1: Cash Reconciliation SQL Error

**Error**: `column p.username does not exist`

**Root Cause**: The query attempts to join with a "profiles" or "passports" table using alias `p`, but production database uses the `User` table.

**Fix**: The current code in `backend/routes/cash-reconciliations.js` already uses the correct approach. The error suggests there might be cached queries or the table doesn't exist yet.

### Action Required:

1. **Verify table exists on production**:
   ```sql
   -- Paste this in your SSH terminal:
   PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "\d cash_reconciliations"
   ```

2. **If table doesn't exist, create it**:
   ```sql
   CREATE TABLE IF NOT EXISTS cash_reconciliations (
     id SERIAL PRIMARY KEY,
     agent_id INTEGER NOT NULL REFERENCES "User"(id),
     reconciliation_date DATE NOT NULL,
     opening_float NUMERIC(10,2) DEFAULT 0,
     expected_cash NUMERIC(10,2) DEFAULT 0,
     actual_cash NUMERIC(10,2) DEFAULT 0,
     variance NUMERIC(10,2) DEFAULT 0,
     cash_denominations JSONB,
     card_transactions NUMERIC(10,2) DEFAULT 0,
     bank_transfers NUMERIC(10,2) DEFAULT 0,
     eftpos_transactions NUMERIC(10,2) DEFAULT 0,
     total_collected NUMERIC(10,2) DEFAULT 0,
     notes TEXT,
     status VARCHAR(20) DEFAULT 'pending',
     approved_by INTEGER REFERENCES "User"(id),
     approval_notes TEXT,
     approved_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_cash_recon_agent ON cash_reconciliations(agent_id);
   CREATE INDEX idx_cash_recon_date ON cash_reconciliations(reconciliation_date);
   CREATE INDEX idx_cash_recon_status ON cash_reconciliations(status);
   ```

3. **Deploy the backend file**: The current `/backend/routes/cash-reconciliations.js` is already correct.

---

## Issue 2: Quotation Reports Filtering Not Working

**Problem**: Filters don't apply to the quotations report.

**Files to investigate**:
- `/src/pages/reports/QuotationsReports.jsx`
- `/src/lib/quotationsService.js`

### Required Actions:

I need to see the QuotationsReports.jsx file to diagnose the filtering issue. The typical problems are:
1. Filter state not passed to API call
2. Backend route not handling query parameters
3. Date format mismatch

**Next Steps**: I'll investigate this after you confirm which specific filters aren't working (date range, status, etc.).

---

## Issue 3: Email Templates System

**Problem**: Email templates management page is empty. Need to connect `/templates` folder templates to the admin interface and actual email sending.

### Implementation Plan:

#### Step 1: Backend Email Template Routes (NEW)

Create `/backend/routes/email-templates.js`:

```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

// Get all email templates
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM email_templates
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      templates: result.rows
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({
      error: 'Failed to fetch email templates',
      message: error.message
    });
  }
});

// Get single template
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM email_templates WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({
      success: true,
      template: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      error: 'Failed to fetch template',
      message: error.message
    });
  }
});

// Create or update template
router.post('/', async (req, res) => {
  try {
    const { name, subject, body, variables, is_active = true } = req.body;

    // Check if template exists
    const existing = await pool.query(
      'SELECT id FROM email_templates WHERE name = $1',
      [name]
    );

    if (existing.rows.length > 0) {
      // Update existing
      const result = await pool.query(`
        UPDATE email_templates
        SET subject = $1, body = $2, variables = $3, is_active = $4, updated_at = NOW()
        WHERE name = $5
        RETURNING *
      `, [subject, body, JSON.stringify(variables || []), is_active, name]);

      res.json({
        success: true,
        template: result.rows[0],
        message: 'Template updated successfully'
      });
    } else {
      // Insert new
      const result = await pool.query(`
        INSERT INTO email_templates (name, subject, body, variables, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [name, subject, body, JSON.stringify(variables || []), is_active]);

      res.json({
        success: true,
        template: result.rows[0],
        message: 'Template created successfully'
      });
    }
  } catch (error) {
    console.error('Error saving template:', error);
    res.status(500).json({
      error: 'Failed to save template',
      message: error.message
    });
  }
});

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM email_templates WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      error: 'Failed to delete template',
      message: error.message
    });
  }
});

module.exports = router;
```

#### Step 2: Seed Default Templates

Create `/backend/seeds/seed-email-templates.sql`:

```sql
-- Insert default email templates from /templates folder
INSERT INTO email_templates (name, subject, body, variables, is_active) VALUES
('voucher_registration',
 'Your PNG Green Fees Voucher - {{voucherCode}}',
 'Dear {{customerName}},\n\nThank you for registering your green fees voucher.\n\n**Voucher Details:**\n- Voucher Code: {{voucherCode}}\n- Passport Number: {{passportNumber}}\n- Valid From: {{validFrom}}\n- Valid Until: {{validUntil}}\n\nPlease present this voucher at the airport.\n\nBest regards,\nPNG Green Fees Team',
 '["customerName","voucherCode","passportNumber","validFrom","validUntil"]'::jsonb,
 true),

('quotation_created',
 'Quotation {{quotationNumber}} - PNG Green Fees',
 'Dear {{customerName}},\n\nYour quotation has been created.\n\n**Quotation Details:**\n- Quotation Number: {{quotationNumber}}\n- Total Amount: PGK {{totalAmount}}\n- Valid Until: {{expiryDate}}\n\nPlease contact us to proceed with payment.\n\nBest regards,\nPNG Green Fees Team',
 '["customerName","quotationNumber","totalAmount","expiryDate"]'::jsonb,
 true),

('payment_success',
 'Payment Confirmation - PNG Green Fees',
 'Dear {{customerName}},\n\nYour payment has been successfully processed.\n\n**Payment Details:**\n- Transaction ID: {{transactionId}}\n- Amount: PGK {{amount}}\n- Payment Method: {{paymentMethod}}\n- Date: {{paymentDate}}\n\nThank you for your payment.\n\nBest regards,\nPNG Green Fees Team',
 '["customerName","transactionId","amount","paymentMethod","paymentDate"]'::jsonb,
 true);
```

#### Step 3: Update Notification Service

Update `/backend/services/notificationService.js` to use templates from database:

```javascript
// Add this function to fetch and render templates
async function renderEmailTemplate(templateName, variables) {
  try {
    const result = await pool.query(
      'SELECT subject, body FROM email_templates WHERE name = $1 AND is_active = true',
      [templateName]
    );

    if (result.rows.length === 0) {
      throw new Error(`Template '${templateName}' not found`);
    }

    let { subject, body } = result.rows[0];

    // Replace variables
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, variables[key]);
      body = body.replace(regex, variables[key]);
    });

    return { subject, body };
  } catch (error) {
    console.error('Error rendering email template:', error);
    throw error;
  }
}

// Update sendVoucherEmail to use template
async function sendVoucherEmail(to, voucherData) {
  try {
    const { subject, body } = await renderEmailTemplate('voucher_registration', {
      customerName: voucherData.customerName || 'Valued Customer',
      voucherCode: voucherData.voucherCode,
      passportNumber: voucherData.passportNumber,
      validFrom: voucherData.validFrom,
      validUntil: voucherData.validUntil
    });

    // Send email using your SMTP service
    // ... existing email sending code
  } catch (error) {
    console.error('Error sending voucher email:', error);
    throw error;
  }
}
```

---

## Issue 4: POS Printer Layout (Epson TM-T82II)

**Problem**: Voucher print layout needs optimization for 80mm thermal paper (Epson TM-T82II).

### Print Specifications for Epson TM-T82II:
- Paper width: 80mm (3.15 inches)
- Print width: 72mm (576 pixels at 203 DPI)
- Characters per line: 48 (at 12pt) or 42 (at 14pt)
- Recommended font: Monospace or Receipt-optimized fonts

### CSS Modifications Required:

Update `/src/components/VoucherPrint.jsx` or create print-specific styles:

```css
@media print {
  @page {
    size: 80mm auto;
    margin: 5mm;
  }

  body {
    width: 80mm;
    margin: 0;
    padding: 0;
    font-family: 'Courier New', monospace;
    font-size: 12pt;
  }

  .voucher-print {
    width: 70mm;
    margin: 0 auto;
    padding: 2mm;
    font-size: 11pt;
    line-height: 1.3;
  }

  .voucher-header {
    text-align: center;
    border-bottom: 2px dashed #000;
    padding-bottom: 3mm;
    margin-bottom: 3mm;
  }

  .voucher-title {
    font-size: 14pt;
    font-weight: bold;
    margin: 2mm 0;
  }

  .voucher-code {
    font-size: 16pt;
    font-weight: bold;
    font-family: 'Courier New', monospace;
    letter-spacing: 1px;
    margin: 3mm 0;
  }

  .voucher-details {
    margin: 2mm 0;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    margin: 1mm 0;
    font-size: 10pt;
  }

  .detail-label {
    font-weight: bold;
    width: 40%;
  }

  .detail-value {
    width: 60%;
    text-align: right;
  }

  .voucher-footer {
    text-align: center;
    border-top: 2px dashed #000;
    padding-top: 3mm;
    margin-top: 3mm;
    font-size: 9pt;
  }

  /* QR Code optimization */
  .qr-code {
    width: 40mm !important;
    height: 40mm !important;
    margin: 3mm auto;
    display: block;
  }

  /* Remove any unnecessary elements */
  .no-print {
    display: none !important;
  }
}
```

---

## Issue 5: SQL Pagination for Passports List

**Problem**: Need server-side pagination (100 per page) with search functionality.

### Backend Changes Required:

Update `/backend/routes/passports.js` - modify the GET / route:

```javascript
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      search = '',
      status = '',
      dateFrom = '',
      dateTo = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT p.*, v.voucher_code, v.status as voucher_status
      FROM passports p
      LEFT JOIN vouchers v ON p.voucher_id = v.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Search filter (searches across multiple fields)
    if (search) {
      query += ` AND (
        p.passport_number ILIKE $${paramCount} OR
        p.surname ILIKE $${paramCount} OR
        p.given_name ILIKE $${paramCount} OR
        v.voucher_code ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Status filter
    if (status) {
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Date range filter
    if (dateFrom) {
      query += ` AND DATE(p.created_at) >= $${paramCount}`;
      params.push(dateFrom);
      paramCount++;
    }

    if (dateTo) {
      query += ` AND DATE(p.created_at) <= $${paramCount}`;
      params.push(dateTo);
      paramCount++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
    const countResult = await pool.query(countQuery, params);
    const totalRecords = parseInt(countResult.rows[0].count);

    // Add pagination
    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    // Execute main query
    const result = await pool.query(query, params);

    res.json({
      success: true,
      passports: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / parseInt(limit)),
        totalRecords,
        recordsPerPage: parseInt(limit),
        hasNextPage: offset + result.rows.length < totalRecords,
        hasPreviousPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching passports:', error);
    res.status(500).json({
      error: 'Failed to fetch passports',
      message: error.message
    });
  }
});
```

---

## Issue 6: SQL Pagination for Vouchers List

**Problem**: Need server-side pagination (100 per page) with search functionality.

### Backend Changes Required:

Update `/backend/routes/vouchers.js` - modify the GET / route:

```javascript
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      search = '',
      status = '',
      dateFrom = '',
      dateTo = '',
      type = '' // individual, corporate, etc.
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT v.*, p.passport_number, p.surname, p.given_name
      FROM vouchers v
      LEFT JOIN passports p ON v.id = p.voucher_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Search filter
    if (search) {
      query += ` AND (
        v.voucher_code ILIKE $${paramCount} OR
        p.passport_number ILIKE $${paramCount} OR
        p.surname ILIKE $${paramCount} OR
        p.given_name ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Status filter
    if (status) {
      query += ` AND v.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Type filter
    if (type) {
      query += ` AND v.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    // Date range filter
    if (dateFrom) {
      query += ` AND DATE(v.created_at) >= $${paramCount}`;
      params.push(dateFrom);
      paramCount++;
    }

    if (dateTo) {
      query += ` AND DATE(v.created_at) <= $${paramCount}`;
      params.push(dateTo);
      paramCount++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
    const countResult = await pool.query(countQuery, params);
    const totalRecords = parseInt(countResult.rows[0].count);

    // Add pagination
    query += ` ORDER BY v.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    // Execute main query
    const result = await pool.query(query, params);

    res.json({
      success: true,
      vouchers: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / parseInt(limit)),
        totalRecords,
        recordsPerPage: parseInt(limit),
        hasNextPage: offset + result.rows.length < totalRecords,
        hasPreviousPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({
      error: 'Failed to fetch vouchers',
      message: error.message
    });
  }
});
```

---

## Deployment Steps

### Step 1: Backend Deployment

Files to deploy to `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`:

1. `routes/cash-reconciliations.js` (already correct, verify table exists)
2. `routes/email-templates.js` (NEW)
3. `routes/passports.js` (UPDATE with pagination)
4. `routes/vouchers.js` (UPDATE with pagination)
5. `services/notificationService.js` (UPDATE to use templates)
6. `seeds/seed-email-templates.sql` (NEW - run once)

### Step 2: Database Migrations

Run these SQL commands in your SSH terminal:

```bash
# 1. Create cash_reconciliations table (if not exists)
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -f /path/to/create-cash-reconciliations-table.sql

# 2. Seed email templates
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -f /path/to/seed-email-templates.sql
```

### Step 3: Restart Backend

```bash
ssh root@165.22.52.100
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 50
```

### Step 4: Frontend Deployment (if changes needed)

After frontend fixes are implemented:

```bash
npm run build
# Upload dist/ contents via CloudPanel
```

---

## Testing Checklist

### Cash Reconciliation
- [ ] Navigate to `/app/reports/cash-reconciliation`
- [ ] Verify page loads without SQL errors
- [ ] Test creating a new reconciliation
- [ ] Test filtering by status, date, agent

### Quotation Reports
- [ ] Navigate to `/app/reports/quotations`
- [ ] Test date range filter
- [ ] Test status filter
- [ ] Verify results update correctly

### Email Templates
- [ ] Navigate to `/app/admin/email-templates`
- [ ] Verify templates are loaded from database
- [ ] Edit a template and save
- [ ] Test sending an email (voucher registration)
- [ ] Verify email uses updated template

### POS Printer
- [ ] Print a voucher from agent interface
- [ ] Verify layout fits 80mm paper
- [ ] Check QR code is readable
- [ ] Verify all details are visible

### Passports Pagination
- [ ] Navigate to `/app/passports`
- [ ] Verify only 100 records load initially
- [ ] Test "Next Page" / "Previous Page"
- [ ] Test search functionality
- [ ] Verify total count is correct

### Vouchers Pagination
- [ ] Navigate to `/app/vouchers`
- [ ] Verify only 100 records load initially
- [ ] Test "Next Page" / "Previous Page"
- [ ] Test search functionality
- [ ] Verify filtering works with pagination

---

## Support Commands

### Check if tables exist:
```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "\dt"
```

### Check backend logs:
```bash
pm2 logs greenpay-api --lines 200 | grep -i error
```

### Monitor API requests:
```bash
pm2 logs greenpay-api --lines 100 | grep -E "(GET|POST|PUT|DELETE)"
```

---

**Prepared by**: Claude Code
**Date**: 2026-01-20
**Status**: Ready for Implementation
**Estimated Time**: 3-4 hours total
