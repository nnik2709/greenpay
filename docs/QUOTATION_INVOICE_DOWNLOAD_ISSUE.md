# Quotation & Invoice Download Issue

**Date:** December 20, 2024
**Status:** 🔴 MISSING BACKEND ENDPOINTS
**Priority:** HIGH

---

## Issue Summary

**Download Quotation** and **View Invoice** functionality is not working because:

1. Frontend code calls **Supabase Edge Functions** that don't exist
2. Backend has **no PDF generation endpoints** for quotations/invoices
3. System was migrated from Supabase to PostgreSQL/Node.js but PDF generation was not implemented

---

## Root Cause Analysis

### Current Frontend Code (BROKEN)

**File:** `src/lib/quotationPdfService.js`

```javascript
// Line 18-20: Tries to call Supabase Edge Function
const { data, error } = await supabase.functions.invoke('generate-quotation-pdf', {
  body: { quotation_id: quotationId }
});
```

**Problem:** This Edge Function doesn't exist because the app no longer uses Supabase.

### Backend Status

**Quotation Endpoints** (`backend/routes/quotations.js`):
- ✅ GET `/` - List quotations
- ✅ GET `/:id` - Get single quotation
- ✅ POST `/` - Create quotation
- ✅ PUT `/:id` - Update quotation
- ✅ DELETE `/:id` - Delete quotation
- ✅ GET `/stats/summary` - Statistics
- ✅ POST `/send-email` - Email quotation
- ✅ POST `/:id/convert-to-invoice` - Convert to invoice
- ❌ **MISSING:** GET `/:id/pdf` - Download quotation PDF
- ❌ **MISSING:** GET `/:id/download` - Download quotation PDF

**PDF Generation** (`backend/utils/pdfGenerator.js`):
- ✅ `generateQuotationPDF(quotation)` - Function exists (line ~500)
- ❌ **NOT EXPOSED:** No API endpoint to call this function

---

## Affected Features

### 1. Download Quotation (HIGH PRIORITY)
- **Page:** Quotations list
- **Button:** "Download" button on each quotation
- **Error:** Supabase Edge Function not found
- **Impact:** Cannot download quotation PDFs

### 2. View Invoice (HIGH PRIORITY)
- **Page:** Invoices list
- **Button:** "View" button on each invoice
- **Error:** Similar issue (likely calls non-existent Edge Function)
- **Impact:** Cannot view/download invoice PDFs

### 3. Email Quotation (PARTIALLY WORKING)
- **Status:** Backend has `/send-email` endpoint
- **Issue:** If SMTP configured, email should work
- **Depends on:** EMAIL_FUNCTIONALITY_ISSUE.md fix

---

## Solution: Add PDF Download Endpoints

### Option 1: Quick Fix - Use Email Logic for Download

The backend already generates PDFs for email attachments. We can reuse this logic:

**Backend Changes Needed:**

1. **Add PDF download endpoint** in `backend/routes/quotations.js`:

```javascript
// GET /api/quotations/:id/pdf
router.get('/:id/pdf', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Get quotation from database
    const result = await pool.query(
      'SELECT * FROM quotations WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const quotation = result.rows[0];

    // Generate PDF using existing function
    const { generateQuotationPDF } = require('../utils/pdfGenerator');
    const pdfBuffer = await generateQuotationPDF(quotation);

    // Send PDF as download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Quotation_${quotation.quotation_number}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating quotation PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});
```

2. **Add invoice PDF download endpoint** in `backend/routes/invoices-gst.js`:

```javascript
// GET /api/invoices/:id/pdf
router.get('/:id/pdf', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Get invoice from database
    const result = await pool.query(
      'SELECT * FROM invoices WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = result.rows[0];

    // Generate PDF
    const { generateInvoicePDF } = require('../utils/pdfGenerator');
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Send PDF as download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice_${invoice.invoice_number}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});
```

**Frontend Changes Needed:**

3. **Update `src/lib/quotationPdfService.js`** to use backend API:

```javascript
/**
 * Generate and download quotation PDF
 * @param {string} quotationId - Quotation ID
 * @returns {Promise<void>}
 */
export async function downloadQuotationPDF(quotationId) {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'https://greenpay.eywademo.cloud/api';

    // Get auth token
    const token = localStorage.getItem('authToken');

    // Fetch PDF from backend
    const response = await fetch(`${API_URL}/quotations/${quotationId}/pdf`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `Quotation_${quotationId}.pdf`;

    // Download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error downloading quotation PDF:', error);
    throw error;
  }
}
```

4. **Create `src/lib/invoicePdfService.js`** with similar logic for invoices.

5. **Update Quotations.jsx and Invoices.jsx** to use new download functions.

---

### Option 2: Full Implementation (Better, but more work)

Add complete PDF generation service with:
- PDF preview in browser
- PDF download
- PDF email
- Caching for performance

This would require more time but provide better UX.

---

## Files to Modify

### Backend:
1. `backend/routes/quotations.js` - Add GET `/:id/pdf` endpoint
2. `backend/routes/invoices-gst.js` - Add GET `/:id/pdf` endpoint

### Frontend:
3. `src/lib/quotationPdfService.js` - Replace Supabase calls with API calls
4. `src/lib/invoicePdfService.js` - Create new file for invoice PDFs
5. `src/pages/Quotations.jsx` - Update download button handler
6. `src/pages/Invoices.jsx` - Update view/download button handler

---

## Testing Plan

### After Implementation:

1. **Test Quotation Download:**
   - Login as Finance Manager
   - Go to Quotations page
   - Click "Download" on any quotation
   - Verify PDF downloads correctly

2. **Test Invoice View:**
   - Go to Invoices page
   - Click "View" on any invoice
   - Verify PDF opens/downloads correctly

3. **Test across roles:**
   - Flex_Admin
   - Finance_Manager
   - Counter_Agent (if they have access)

4. **Test error handling:**
   - Try downloading non-existent quotation
   - Try without authentication
   - Check error messages are user-friendly

---

## Deployment Steps

### Step 1: Backend Changes

1. Add PDF endpoints to quotations.js
2. Add PDF endpoints to invoices-gst.js
3. Test locally
4. Deploy to production
5. Restart PM2: `pm2 restart greenpay-api`

### Step 2: Frontend Changes

1. Update quotationPdfService.js
2. Create invoicePdfService.js
3. Update Quotations.jsx
4. Update Invoices.jsx
5. Test locally
6. Build: `npm run build`
7. Deploy dist/ to production

### Step 3: Verify

1. Test quotation download
2. Test invoice view
3. Check browser console for errors
4. Verify PDFs are correctly formatted

---

## Code References

### Existing PDF Generation Functions

**File:** `backend/utils/pdfGenerator.js`

```javascript
// Line ~500
async function generateQuotationPDF(quotation) {
  // Already implemented - generates quotation PDF
  // Returns Buffer
}

// Line ~700
async function generateInvoicePDF(invoice) {
  // Already implemented - generates invoice PDF
  // Returns Buffer
}
```

These functions are already working and used for email attachments. We just need to expose them via API endpoints.

### Email Quotation Endpoint (Working Example)

**File:** `backend/routes/quotations.js:378`

```javascript
// POST /api/quotations/send-email
router.post('/send-email', authMiddleware, async (req, res) => {
  const { quotationId, recipientEmail } = req.body;

  // Get quotation
  const result = await pool.query('SELECT * FROM quotations WHERE id = $1', [quotationId]);
  const quotation = result.rows[0];

  // Generate PDF (THIS WORKS!)
  const pdfBuffer = await generateQuotationPDF(quotation);

  // Send email with PDF attachment
  await sendQuotationEmail(recipientEmail, quotation, pdfBuffer);

  res.json({ success: true });
});
```

We can use the same pattern for download endpoints.

---

## Estimated Time

### Quick Fix (Option 1):
- Backend changes: 30 minutes
- Frontend changes: 1 hour
- Testing: 30 minutes
- **Total: 2 hours**

### Full Implementation (Option 2):
- Backend changes: 2 hours
- Frontend changes: 3 hours
- Testing: 1 hour
- **Total: 6 hours**

---

## Recommendation

**Use Option 1 (Quick Fix)** to get functionality working immediately.

The PDF generation code already exists and works (used for email attachments). We just need to:
1. Add 2 backend endpoints (15 lines each)
2. Update frontend to call backend API instead of Supabase
3. Test and deploy

This is a **low-risk, high-impact** fix that reuses existing, working code.

---

## Next Steps

1. ✅ Document issue (this file)
2. ⏳ Implement backend PDF endpoints
3. ⏳ Update frontend PDF services
4. ⏳ Test locally
5. ⏳ Deploy to production
6. ⏳ Verify on production

---

**Document Version:** 1.0
**Last Updated:** December 20, 2024
**Ready for Implementation:** ✅ YES
