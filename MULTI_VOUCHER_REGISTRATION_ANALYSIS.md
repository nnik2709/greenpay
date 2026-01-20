# Multi-Voucher Registration Flow - Issue Analysis & Solution

**Date**: 2026-01-20
**Issue**: When purchasing multiple vouchers (>1), after registering the first passport, remaining vouchers disappear from view

---

## Current Flow Analysis

### Step 1: Voucher Creation (`IndividualPurchase.jsx`)
- Agent selects quantity (1-5 vouchers)
- Enters payment details
- Clicks "Create Vouchers"
- System creates batch and shows voucher list (step = 'list')

### Step 2: Voucher List Display (Lines 84-155)
```jsx
{vouchers.map((voucher) => (
  <Card key={voucher.id}>
    <Button onClick={() => navigate(`/app/voucher-registration?code=${voucher.voucherCode}`)}>
      Register Passport →
    </Button>
  </Card>
))}
```

### Step 3: Registration (`CorporateVoucherRegistration.jsx`)
- User clicks "Register Passport →" for first voucher
- **NAVIGATION OCCURS**: Taken to `/app/voucher-registration?code=XXXXXX`
- User enters/scans passport data
- Submits registration
- Success screen shows with Print/Email/Download options

### **THE PROBLEM**
After registering the first voucher:
- User is on the success screen (`CorporateVoucherRegistration.jsx` step 3)
- Only option is "Register Another Voucher" (line 931) which **resets to step 1**
- **No way to return to the original batch list** (in `IndividualPurchase.jsx`)
- User loses context:
  - How many vouchers remain?
  - Which voucher codes are unregistered?
  - What's the batch ID?
- User must manually navigate back or remember voucher codes

---

## User's Requirements

From the original request:
> "There should be N-steps process when Agent circles through vouchers and adds passport, having overview all the time of the status. At the end Agent should be able to Print, Download or Email all vouchers having registered passport (and not having anymore QR code or registration link, but passport number instead)"

### Required Features:
1. **N-step wizard** - Sequential registration of multiple vouchers
2. **Status overview** - Always visible list showing which vouchers are registered/pending
3. **Navigation** - Ability to move forward/backward through vouchers
4. **Bulk actions at end**:
   - Print all registered vouchers
   - Download all as single PDF or ZIP
   - Email all to customer
5. **Updated voucher display** - After registration, show passport number instead of QR code/registration link

---

## Proposed Solution

### Option 1: Inline Registration Wizard (RECOMMENDED)
Modify `IndividualPurchase.jsx` to add a registration wizard mode without navigation.

**New Flow:**
1. Agent creates batch of N vouchers
2. List screen shows all vouchers with "Start Registration Wizard" button
3. Wizard opens in same page with:
   - **Left sidebar**: All vouchers with status indicators (✅ Registered, ⏳ Pending)
   - **Main area**: Passport entry form for current voucher
   - **Progress bar**: "Registering 2 of 5 vouchers"
   - **Navigation**: "Previous" / "Next" / "Skip This One" buttons
4. After last voucher, show completion screen with:
   - Summary: X of Y vouchers registered
   - Bulk actions: Print All, Email All, Download All
   - Individual actions for each voucher

**Advantages:**
- No navigation away from batch context
- Always visible overview of batch status
- Can skip vouchers and return later
- Agent stays on same page
- Better UX for bulk operations

**Implementation Changes:**
- Add new step: `registration-wizard` to `IndividualPurchase.jsx`
- Add voucher status tracking in state
- Inline passport form (reuse form fields from `CorporateVoucherRegistration.jsx`)
- Add bulk print/email/download API endpoints

### Option 2: Session-Based Navigation (Alternative)
Store batch context in localStorage/sessionStorage and modify `CorporateVoucherRegistration.jsx` to show "Return to Batch" button.

**Advantages:**
- Less code changes
- Reuses existing registration page

**Disadvantages:**
- Still requires navigation back and forth
- Harder to maintain overview
- Poor UX for bulk operations

---

## Recommended Implementation Plan

### Phase 1: Add Registration Wizard to IndividualPurchase.jsx
1. Add new wizard step between 'list' and completion
2. Create sidebar component showing all vouchers with status
3. Add inline passport registration form
4. Add navigation (Next/Previous/Skip) buttons
5. Track registration status in state

### Phase 2: Bulk Actions
1. **Individual PDFs**: Each voucher already generates its own PDF via `/api/vouchers/download/:id`
2. Create backend endpoint: `POST /api/vouchers/bulk-download` (returns ZIP of individual PDFs)
3. Create backend endpoint: `POST /api/vouchers/bulk-email` (sends individual PDF attachments to customer)
4. Create backend endpoint: `POST /api/vouchers/bulk-print` (returns multi-page PDF with individual vouchers for printing)
5. Add frontend buttons for bulk actions

**Important**: Each voucher maintains its own separate PDF file. Bulk operations collect individual PDFs rather than merging them.

### Phase 3: Updated Voucher Display
1. Modify voucher card to show:
   - ✅ Registered: Show passport number, hide QR code
   - ⏳ Unregistered: Show "Register Now" button
2. Add inline status badges
3. Update PDF generator to exclude QR code for registered vouchers

---

## Technical Considerations

### State Management
```javascript
const [registrationProgress, setRegistrationProgress] = useState({
  currentIndex: 0, // Which voucher we're registering (0-based)
  registeredVouchers: new Set(), // IDs of successfully registered vouchers
  skippedVouchers: new Set(), // IDs of vouchers user wants to skip
});
```

### API Integration
- Reuse existing `/api/corporate-voucher-registration/register` endpoint
- Add bulk endpoints for print/email/download
- Consider pagination for large batches (>10 vouchers)

### Edge Cases
1. User closes browser mid-registration → Save progress to backend?
2. User wants to skip a voucher → Mark as skipped, allow return later
3. Registration fails → Show error, allow retry
4. Customer email not provided → Prompt for email before bulk email

---

## Files to Modify

1. **`src/pages/IndividualPurchase.jsx`** (MAJOR CHANGES)
   - Add registration wizard step
   - Add voucher status tracking
   - Add inline passport registration form
   - Add bulk action buttons

2. **`backend/routes/vouchers.js`** (NEW ENDPOINTS)
   - `POST /api/vouchers/bulk-download` - Download multiple vouchers as ZIP of **individual PDFs**
   - `POST /api/vouchers/bulk-email` - Email with **multiple separate PDF attachments** (one per voucher)
   - `POST /api/vouchers/bulk-print` - Print-optimized multi-page PDF (concatenated for printing)

3. **`backend/utils/pdfGenerator.js`** (ENHANCEMENT)
   - Add option to hide QR code for registered vouchers
   - Add multi-voucher concatenated PDF for printing

4. **`backend/services/notificationService.js`** (ENHANCEMENT)
   - Update email service to support **multiple PDF attachments in single email**

5. **`src/components/PassportRegistrationForm.jsx`** (NEW COMPONENT)
   - Extract passport form from `CorporateVoucherRegistration.jsx`
   - Make reusable for inline use in `IndividualPurchase.jsx`

---

## Next Steps

1. Create wireframe/mockup of the wizard UI
2. Get user approval on the design
3. Implement Phase 1 (wizard UI)
4. Test with 2-5 voucher batches
5. Implement Phase 2 (bulk actions)
6. Deploy and test in production

---

## Estimated Effort

- Phase 1 (Wizard UI): 6-8 hours
- Phase 2 (Bulk Actions): 3-4 hours
- Phase 3 (Updated Display): 2-3 hours
- Testing & Refinement: 2-3 hours

**Total**: 13-18 hours

---

**Status**: ⏳ Analysis Complete - Ready for Implementation
**Priority**: HIGH (User explicitly requested as second priority after user registration fix)

---

## Bulk Email Implementation Details

### Requirements (Confirmed with User)
- Each voucher must have its **own separate PDF file**
- Bulk email sends **ONE email with MULTIPLE PDF attachments** (not merged)
- Example: 3 vouchers = 1 email with 3 separate PDF files attached

### Email Structure for Multiple Vouchers

**Scenario**: Agent completes registration for 3 vouchers and clicks "Email All"

**Email Properties:**
- **To**: Customer email address (collected during purchase or prompted before send)
- **Subject**: "Your PNG Green Fee Vouchers - Batch [BATCH_ID]"
- **Body** (HTML):
  ```html
  Dear Customer,

  Please find attached your 3 PNG Green Fee vouchers for [COMPANY_NAME or CUSTOMER_NAME]:

  1. Voucher ABC12345 - Passport: XX123456
  2. Voucher DEF67890 - Passport: YY789012
  3. Voucher GHI34567 - Passport: ZZ345678

  Each voucher is provided as a separate PDF attachment.

  Important: Present your voucher code and passport at entry checkpoints.

  Thank you for using PNG Green Fees.
  ```
- **Attachments**:
  - `voucher-ABC12345.pdf` (Individual PDF #1 - generated via existing endpoint)
  - `voucher-DEF67890.pdf` (Individual PDF #2 - generated via existing endpoint)
  - `voucher-GHI34567.pdf` (Individual PDF #3 - generated via existing endpoint)

### Backend Implementation

#### New Endpoint: `POST /api/vouchers/bulk-email`

```javascript
// backend/routes/vouchers.js
router.post('/bulk-email', auth, async (req, res) => {
  const { voucherIds, recipientEmail } = req.body;

  try {
    // 1. Validate inputs
    if (!Array.isArray(voucherIds) || voucherIds.length === 0) {
      return res.status(400).json({ error: 'Voucher IDs array required' });
    }

    if (!recipientEmail || !recipientEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ error: 'Valid email address required' });
    }

    // 2. Fetch all voucher records
    const query = `
      SELECT id, voucher_code, passport_number, company_name, customer_name, amount
      FROM v_all_vouchers
      WHERE id = ANY($1)
      ORDER BY id
    `;
    const result = await db.query(query, [voucherIds]);
    const vouchers = result.rows;

    if (vouchers.length === 0) {
      return res.status(404).json({ error: 'No vouchers found' });
    }

    // 3. Generate individual PDFs for each voucher (reuse existing PDF generator)
    const pdfAttachments = [];
    for (const voucher of vouchers) {
      // Call existing PDF generation logic
      const pdfBuffer = await generateVoucherPDF(voucher.id);
      
      pdfAttachments.push({
        filename: `voucher-${voucher.voucher_code}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }

    // 4. Build email body with voucher list
    const voucherList = vouchers.map((v, index) => 
      `${index + 1}. Voucher ${v.voucher_code} - Passport: ${v.passport_number}`
    ).join('\n');

    const emailBody = `
      <p>Dear Customer,</p>
      
      <p>Please find attached your ${vouchers.length} PNG Green Fee voucher${vouchers.length > 1 ? 's' : ''}:</p>
      
      <p style="font-family: monospace; white-space: pre-line;">${voucherList}</p>
      
      <p>Each voucher is provided as a separate PDF attachment.</p>
      
      <p><strong>Important:</strong> Present your voucher code and passport at entry checkpoints.</p>
      
      <p>Thank you for using PNG Green Fees.</p>
    `;

    // 5. Send email with multiple attachments
    await sendEmailWithAttachments({
      to: recipientEmail,
      subject: `Your PNG Green Fee Vouchers - Batch ${vouchers[0].batch_id || 'Custom'}`,
      html: emailBody,
      attachments: pdfAttachments // Array of separate PDF files
    });

    res.json({ 
      success: true, 
      emailsSent: 1, 
      voucherCount: vouchers.length,
      recipient: recipientEmail
    });

  } catch (error) {
    console.error('Bulk email error:', error);
    res.status(500).json({ error: 'Failed to send bulk email' });
  }
});
```

### Email Service Enhancement (Nodemailer)

Update `backend/services/notificationService.js` to support multiple attachments:

```javascript
// backend/services/notificationService.js

/**
 * Send email with multiple PDF attachments
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {Array} options.attachments - Array of { filename, content, contentType }
 */
async function sendEmailWithAttachments(options) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@greenpay.eywademo.cloud',
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments || [] // Array of attachments
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.to} with ${options.attachments.length} attachment(s):`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = {
  sendEmailWithAttachments,
  // ... other exports
};
```

### Frontend Implementation

Update `IndividualPurchase.jsx` wizard completion screen:

```javascript
// In the wizard completion screen
const handleBulkEmail = async () => {
  // Get registered voucher IDs
  const registeredIds = vouchers
    .filter(v => registrationProgress.registeredVouchers.has(v.id))
    .map(v => v.id);

  if (registeredIds.length === 0) {
    toast({
      title: 'No Registered Vouchers',
      description: 'Please register at least one voucher before emailing.',
      variant: 'destructive'
    });
    return;
  }

  // Prompt for email if not collected during purchase
  const email = customerEmail || prompt('Enter customer email address:');
  if (!email) return;

  try {
    setLoading(true);
    
    const response = await api.post('/vouchers/bulk-email', {
      voucherIds: registeredIds,
      recipientEmail: email
    });

    if (response.success) {
      toast({
        title: 'Email Sent!',
        description: `${response.voucherCount} vouchers emailed to ${response.recipient}`,
      });
    }
  } catch (error) {
    toast({
      title: 'Email Failed',
      description: error.message || 'Failed to send email',
      variant: 'destructive'
    });
  } finally {
    setLoading(false);
  }
};
```

### Key Points

1. **Each voucher PDF is generated independently** using existing PDF generation logic
2. **One email with N attachments** (not N separate emails)
3. **Reuses existing voucher PDF endpoint** logic for consistency
4. **Nodemailer supports multiple attachments** natively via attachments array
5. **Email size limit**: Most email providers support up to 25MB total (each PDF ~80-100KB, so ~250 vouchers max)

---

**Updated Status**: ✅ Analysis Complete with Email Specifications
**Next**: Awaiting user approval of design before implementation

