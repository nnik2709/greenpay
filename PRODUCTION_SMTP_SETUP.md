# Production SMTP Setup for Password Reset

## Overview
The password reset functionality is fully implemented but requires SMTP email configuration to send password reset emails.

## What's Already Done ✅

1. ✅ Database columns added (`reset_token`, `reset_token_expiry` on `User` table)
2. ✅ Backend API endpoints implemented in `/backend/routes/auth.js`:
   - `POST /api/auth/request-password-reset` - Generates token and sends email
   - `POST /api/auth/verify-reset-token` - Validates reset token
   - `POST /api/auth/reset-password` - Updates password with token
3. ✅ Frontend API client methods added in `src/lib/api/client.js`
4. ✅ `nodemailer` and `bcrypt` packages installed
5. ✅ Server running without errors

## What Needs Configuration on Production ⚙️

### Step 1: Choose Email Provider

**Option A: Gmail (Recommended for testing)**
- Free and reliable
- Requires Google Account with 2-Step Verification enabled
- Limit: ~500 emails/day

**Option B: SendGrid**
- Professional email service
- Free tier: 100 emails/day
- Better deliverability for production

**Option C: AWS SES**
- Enterprise-grade
- Very low cost ($0.10 per 1000 emails)
- Requires AWS account

**Option D: Custom SMTP**
- Use your organization's SMTP server
- Contact IT department for credentials

### Step 2: Get SMTP Credentials

#### For Gmail:
1. Enable 2-Step Verification on your Google Account
2. Go to: https://myaccount.google.com/apppasswords
3. Select "Mail" and "Other (Custom name)" → Enter "GreenPay"
4. Google will generate a 16-character app password
5. Copy this password (you won't be able to see it again)

#### For SendGrid:
1. Sign up at https://sendgrid.com
2. Go to Settings → API Keys
3. Create new API key with "Mail Send" permissions
4. Copy the API key

#### For AWS SES:
1. Sign up for AWS
2. Set up SES in your region
3. Verify your domain or email address
4. Get SMTP credentials from SES Console

### Step 3: Update Production .env File

SSH into production server:
```bash
ssh root@72.61.208.79
nano /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env
```

**For Gmail:**
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM="GreenPay Support <your-email@gmail.com>"

# Frontend URL for reset links
FRONTEND_URL=https://greenpay.eywademo.cloud
```

**For SendGrid:**
```env
# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM="GreenPay Support <noreply@greenpay.eywademo.cloud>"

# Frontend URL for reset links
FRONTEND_URL=https://greenpay.eywademo.cloud
```

**For AWS SES:**
```env
# Email Configuration
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
SMTP_FROM="GreenPay Support <noreply@greenpay.eywademo.cloud>"

# Frontend URL for reset links
FRONTEND_URL=https://greenpay.eywademo.cloud
```

### Step 4: Restart Server

```bash
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 20
```

Check for any SMTP connection errors in the logs.

### Step 5: Test Password Reset

1. Go to https://greenpay.eywademo.cloud/login
2. Click "Forgot Password?"
3. Enter a valid user email from the database
4. Check the email inbox for reset link
5. Click the link and set a new password
6. Verify you can log in with the new password

## Troubleshooting

### "Invalid login" or "Authentication failed"
- Double-check SMTP_USER and SMTP_PASS in .env
- For Gmail: Ensure you're using App Password, not regular password
- For Gmail: Verify 2-Step Verification is enabled

### "Connection timeout" or "ETIMEDOUT"
- Check firewall allows outbound connections on port 587
- Try port 465 with SSL instead
- Some hosting providers block port 25 and 587

### Emails not received
- Check spam/junk folder
- Verify SMTP_FROM email is valid
- For custom domains: Set up SPF and DKIM records
- Check email provider's sending limits

### "Self-signed certificate" error
- Set `rejectUnauthorized: false` in nodemailer config (not recommended for production)
- Or ensure proper SSL certificates are installed

## Security Best Practices

1. **Never commit .env file to git** - Already in .gitignore
2. **Use App Passwords** - Never use your main email password
3. **Rotate credentials** - Change SMTP password every 6-12 months
4. **Monitor sending limits** - Track daily email volume
5. **Use dedicated email** - Create noreply@yourdomain.com for system emails
6. **Set up SPF/DKIM** - Improves deliverability and prevents spoofing

## Email Templates Included

The password reset emails include professional HTML templates:

- **Request confirmation email** - Sent when user requests reset
- **Reset link email** - Contains the password reset link (valid 1 hour)
- **Success confirmation email** - Sent after password is successfully changed

All templates are in `/backend/routes/auth.js` and can be customized.

## Testing Without Email (Development)

For testing without configuring SMTP, you can:

1. **Check server logs** - The reset token is logged to console
2. **Use token directly** - Copy token from logs and use in API call
3. **Use Mailtrap.io** - Fake SMTP server for testing (free tier available)

Example with Mailtrap:
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
SMTP_FROM="GreenPay Support <noreply@greenpay.com>"
FRONTEND_URL=http://localhost:3000
```

## Production Readiness Checklist

- [ ] Choose and set up email provider
- [ ] Get SMTP credentials
- [ ] Update .env with real SMTP settings
- [ ] Update FRONTEND_URL to production domain
- [ ] Restart PM2 server
- [ ] Test password reset flow end-to-end
- [ ] Verify emails are delivered (not in spam)
- [ ] Test token expiry (should expire after 1 hour)
- [ ] Verify old tokens can't be reused
- [ ] Test with multiple users
- [ ] Monitor email sending in production

## Cost Estimates

- **Gmail**: Free (500 emails/day limit)
- **SendGrid**: Free tier (100 emails/day), $15/month for 40k emails
- **AWS SES**: $0.10 per 1000 emails (very cheap for low volume)
- **Mailtrap**: Free for testing (not for production)

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs greenpay-api`
2. Check PostgreSQL logs if database errors occur
3. Test SMTP credentials with online SMTP testers
4. Review nodemailer documentation: https://nodemailer.com/

---

**Status**: Password reset feature is code-complete and ready for production. Only SMTP configuration is needed.
