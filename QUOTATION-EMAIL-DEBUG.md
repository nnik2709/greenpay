# Quotation Email Debugging - Enhanced Logging
**Date:** January 25, 2026
**Issue:** Quotation emails don't arrive (Invoice emails work)

---

## 🔍 Investigation Status

### What Works ✅
- **Invoice emails:** Working correctly after SMTP_FROM fix
- **SMTP connection:** Verified working

### What Doesn't Work ❌
- **Quotation emails:** Show success but not received
- **No errors:** Backend returns success, no errors in logs

---

## 🐛 Potential Causes

### 1. **PDF Generation Failure**
- If PDF fails to generate, email might be sent without attachment
- Some email providers block emails without expected attachments
- **Solution:** Added detailed PDF generation logging

### 2. **Email Silently Rejected**
- Email might be sent but rejected by recipient's mail server
- No error returned to sender
- **Solution:** Added detailed SMTP response logging

### 3. **Spam Filtering**
- Email arrives but goes to spam/junk folder
- **Solution:** Check spam folder, add detailed logging

---

## ✅ Changes Made

### Enhanced Logging in `sendQuotationEmail()`

**File:** `backend/services/notificationService.js`

#### 1. PDF Generation Logging (Line ~343)

**Before:**
```javascript
try {
  pdfBuffer = await generateQuotationPDF(quotation);
  console.log('✅ Quotation PDF generated successfully');
} catch (error) {
  console.error('⚠️ Failed to generate quotation PDF:', error);
  pdfBuffer = null;
}
```

**After:**
```javascript
try {
  pdfBuffer = await generateQuotationPDF(quotation);
  console.log('✅ Quotation PDF generated successfully, size:', pdfBuffer ? pdfBuffer.length : 0, 'bytes');
} catch (error) {
  console.error('❌ Failed to generate quotation PDF:', error.message);
  console.error('Stack:', error.stack);
  pdfBuffer = null;
}
```

#### 2. Email Sending Logging (Line ~486)

**Before:**
```javascript
try {
  const result = await transporter.sendMail(mailOptions);
  console.log('✅ Quotation email sent successfully to:', recipientEmail);
  return { success: true, ... };
} catch (error) {
  console.error('❌ Failed to send quotation email:', error);
  throw error;
}
```

**After:**
```javascript
try {
  console.log('📧 Attempting to send quotation email...');
  console.log('   To:', recipientEmail);
  console.log('   From:', mailOptions.from);
  console.log('   Subject:', emailSubject);
  console.log('   Has PDF:', !!pdfBuffer);

  const result = await transporter.sendMail(mailOptions);
  console.log('✅ Quotation email sent successfully!');
  console.log('   Recipient:', recipientEmail);
  console.log('   Message ID:', result.messageId);
  console.log('   Response:', result.response);

  return { success: true, ... };
} catch (error) {
  console.error('❌ Failed to send quotation email:', error.message);
  console.error('   Error code:', error.code);
  console.error('   Error command:', error.command);
  console.error('   Full error:', error);
  throw error;
}
```

---

## 🚀 Deployment & Testing

### Step 1: Deploy Updated File

```bash
# From local machine
scp backend/services/notificationService.js root@165.22.52.100:/tmp/

# SSH to server
ssh root@165.22.52.100

# Backup current file
cp /var/www/greenpay/backend/services/notificationService.js \
   /var/www/greenpay/backend/services/notificationService.js.backup-debug

# Deploy new file
mv /tmp/notificationService.js /var/www/greenpay/backend/services/notificationService.js
chown root:root /var/www/greenpay/backend/services/notificationService.js

# Restart API
pm2 restart greenpay-api --update-env
```

### Step 2: Monitor Logs in Real-Time

```bash
# Watch PM2 logs
pm2 logs greenpay-api --lines 100

# Keep this terminal open while testing
```

### Step 3: Send Test Quotation Email

1. Go to https://greenpay.eywademo.cloud/app/quotations
2. Select any quotation
3. Click "Send Email"
4. Enter your email address
5. Click Send
6. **Watch the PM2 logs immediately**

---

## 📊 Expected Log Output

### Successful Email Send:

```
✅ Quotation PDF generated successfully, size: 45231 bytes
✅ SMTP connection verified
📧 Attempting to send quotation email...
   To: test@example.com
   From: "PNG Green Fees System" <noreply@greenpay.eywademo.cloud>
   Subject: Quotation Q-2026-001 - Climate Change and Development Authority
   Has PDF: true
✅ Quotation email sent successfully!
   Recipient: test@example.com
   Message ID: <abc123@smtp-relay.brevo.com>
   Response: 250 2.0.0 Ok: queued as ABC123
```

### PDF Generation Failure:

```
❌ Failed to generate quotation PDF: Cannot read property 'quotation_number' of undefined
Stack: Error: Cannot read property 'quotation_number' of undefined
    at generateQuotationPDF (/var/www/greenpay/backend/utils/pdfGenerator.js:123:45)
⚠️ Continuing without PDF attachment
📧 Attempting to send quotation email...
   Has PDF: false  ⬅️ No attachment!
```

### Email Send Failure:

```
❌ Failed to send quotation email: Invalid sender
   Error code: EAUTH
   Error command: MAIL FROM
   Full error: { ... }
Send quotation email error: Error: Invalid sender
```

---

## 🔧 Diagnosis Based on Logs

### Scenario 1: PDF Generates, Email Sends, Not Received

**Log shows:**
```
✅ Quotation PDF generated successfully, size: 45231 bytes
✅ Quotation email sent successfully!
   Message ID: <abc123@smtp-relay.brevo.com>
   Response: 250 2.0.0 Ok: queued
```

**Likely cause:** Email going to spam folder

**Solution:**
1. Check spam/junk folder
2. Add `noreply@greenpay.eywademo.cloud` to contacts
3. Check if domain SPF/DKIM records are configured

---

### Scenario 2: PDF Fails to Generate

**Log shows:**
```
❌ Failed to generate quotation PDF: ...
   Has PDF: false
✅ Quotation email sent successfully!
```

**Likely cause:** Email sent without PDF, recipient server rejects

**Solution:**
1. Fix PDF generation error shown in logs
2. Check quotation data structure
3. Verify all required fields are present

---

### Scenario 3: SMTP Error

**Log shows:**
```
❌ Failed to send quotation email: ...
   Error code: EAUTH / EENVELOPE / ...
```

**Likely cause:** SMTP configuration issue

**Solution:**
1. Check error code and message
2. Verify SMTP_FROM is set correctly
3. Check Brevo account status

---

## 📧 Comparison: Quotation vs Invoice Email

### Key Differences:

| Aspect | Quotation Email | Invoice Email |
|--------|----------------|---------------|
| **PDF Generator** | `generateQuotationPDF()` | Uses different method |
| **Email Template** | Custom HTML with Climate Change branding | Different template |
| **SMTP Config** | Uses own transporter | Uses own transporter |
| **Sender** | Now fixed to use SMTP_FROM ✅ | Now fixed to use SMTP_FROM ✅ |

### Both Should Now Work Because:

✅ Both use `SMTP_FROM` for sender (fixed)
✅ Both verify SMTP connection before sending
✅ Both throw errors on failure
✅ Both have proper error handling

---

## 🎯 Next Steps

### After Deployment:

1. **Test and capture logs**
   ```bash
   # In one terminal: watch logs
   pm2 logs greenpay-api --lines 100

   # In browser: send test quotation email
   # Immediately check logs for detailed output
   ```

2. **Share the log output**
   - Copy the full log output from the moment you click "Send Email"
   - This will show exactly what's happening

3. **Check all folders**
   - Inbox
   - Spam/Junk
   - Promotions (Gmail)
   - Updates (Gmail)

4. **Try different email addresses**
   - Gmail
   - Outlook
   - Other provider

---

## 📝 Additional Checks

### If Email Still Not Received:

```bash
# 1. Check Brevo dashboard
# Login to Brevo account and check:
# - Sent emails list
# - Bounced emails
# - Blocked senders

# 2. Test SMTP connection manually
node /var/www/greenpay/backend/test-email.js

# 3. Check email quotas
# Verify Brevo account hasn't hit daily limit

# 4. Check DNS records
dig greenpay.eywademo.cloud TXT  # Check SPF/DKIM
```

---

**Status:** Ready for deployment with enhanced logging
**Next:** Deploy, test, and analyze logs to find root cause
