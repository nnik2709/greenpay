# Corporate Voucher Email - Separate PDF Attachments

## Changes Made

### Previous Behavior:
- All corporate vouchers in a batch were combined into **one single PDF file**
- Email had one attachment: `CompanyName_Batch_123_2026-01-25.pdf` (multi-page)

### New Behavior:
- Each corporate voucher is generated as a **separate PDF file**
- Email has multiple attachments: `CompanyName_Voucher_CODE1.pdf`, `CompanyName_Voucher_CODE2.pdf`, etc.
- Each PDF contains exactly one voucher with QR code

## Email Attachment Limitations

### SMTP Server Limits:
- **Brevo (Current Provider)**: 15 MB total per email
- **Gmail SMTP**: 25 MB total per email
- **General SMTP Servers**: 10-25 MB typical limit

### Safe Operating Limits (Implemented):
- **Maximum total size**: 10 MB per email (safety threshold)
- **Individual voucher PDF size**: ~100-150 KB each
- **Recommended batch size**: Up to 60-70 vouchers per email
- **Maximum batch size**: ~80-90 vouchers (before hitting 10 MB limit)

### Size Validation:
The system now checks total attachment size before sending:
- ✅ If total size < 10 MB: Email sent successfully
- ❌ If total size ≥ 10 MB: Returns error with suggestion to download instead

## Modified Files

### Backend:
**File**: `backend/routes/vouchers.js`
**Endpoint**: `POST /api/vouchers/email-batch`

**Changes**:
1. **Line 1084-1115**: Generate individual PDF for each voucher in loop
2. **Line 1088**: Added 10 MB safety check
3. **Line 1119**: Updated email content to mention "separate PDF files"
4. **Line 1133**: Updated instructions for individual voucher distribution
5. **Line 1209**: Use `pdfAttachments` array instead of single attachment

**New Features**:
- Progress logging: Shows generation progress every 10 vouchers
- Size monitoring: Tracks total attachment size in real-time
- Error handling: Returns 400 error if total size exceeds 10 MB with helpful message

## Example Response

### Success (< 10 MB):
```json
{
  "success": true,
  "message": "Batch 123 emailed successfully to company@example.com",
  "voucher_count": 50
}
```

### Error (≥ 10 MB):
```json
{
  "error": "Email size too large",
  "message": "Total attachment size (12.45 MB) exceeds safe email limit of 10 MB. Please reduce batch size or download vouchers instead.",
  "totalSize": 13058867,
  "voucherCount": 120
}
```

## Console Logging

The system now logs generation progress:
```
Generating 50 individual PDF vouchers for batch 123...
Generated 10/50 vouchers (1.23 MB)
Generated 20/50 vouchers (2.45 MB)
Generated 30/50 vouchers (3.67 MB)
Generated 40/50 vouchers (4.89 MB)
Generated 50/50 vouchers (6.12 MB)
Total email size: 6.12 MB for 50 vouchers
```

## Email Template Updates

### Subject Line:
No change - still shows voucher count:
```
Company Name - Batch 123 Airport Exit Vouchers (50 vouchers)
```

### Email Body:
Updated to reflect separate attachments:
- "Please find **50 vouchers attached as separate PDF files**"
- New instruction: "Download all PDF attachments"
- New instruction: "Each employee gets their own voucher PDF file"

## Testing Recommendations

### Test Cases:
1. **Small batch** (5 vouchers): Should work perfectly
2. **Medium batch** (50 vouchers): Should work well (~6-7 MB)
3. **Large batch** (80 vouchers): Should work (~10 MB limit)
4. **Over-limit batch** (120+ vouchers): Should return error message

### Production Considerations:
- For very large batches (>80 vouchers), recommend using **Download** instead of **Email**
- Consider adding frontend warning when batch size > 80 vouchers
- Monitor email delivery success rates for batches 60-80 vouchers

## Alternative Solutions (Future Enhancement)

If email size limits become problematic:

1. **Option A**: Split large batches into multiple emails
   - Send 60 vouchers per email
   - Subject: "Batch 123 - Part 1 of 2 (60 vouchers)"

2. **Option B**: Upload to cloud storage and send download link
   - Generate all PDFs and ZIP them
   - Upload ZIP to S3/cloud storage
   - Email contains download link instead of attachments
   - Link expires after 7 days

3. **Option C**: Hybrid approach
   - Small batches (<60): Send as email attachments
   - Large batches (≥60): Send download link
