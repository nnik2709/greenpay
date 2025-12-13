# Test Email Notifications Setup (Sandbox Mode)

## Quick Setup with Gmail

### Step 1: Generate Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click "Security" (left sidebar)
3. Enable "2-Step Verification" (if not already enabled)
4. Scroll down to "App passwords"
5. Click "App passwords"
6. Select:
   - App: "Mail"
   - Device: "Other" → Type "GreenPay Backend"
7. Click "Generate"
8. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Update Backend .env File

SSH to your server and edit the `.env` file:

```bash
ssh root@72.61.208.79
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
nano .env
```

Add these lines at the end:

```env
# Email Configuration (Gmail for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM="PNG Green Fees <your.email@gmail.com>"
PUBLIC_URL=http://localhost:3000
```

**Replace:**
- `your.email@gmail.com` with your Gmail address
- `abcd efgh ijkl mnop` with your generated app password

Save and exit (Ctrl+X, then Y, then Enter)

### Step 3: Install Required Package

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
npm install nodemailer
```

### Step 4: Update Notification Service

The notification service code needs to be updated to use real SMTP instead of mock.

I'll create the updated version for you to upload.

### Step 5: Restart Backend

```bash
pm2 restart greenpay-api
```

### Step 6: Test!

Make a test purchase:
1. Go to: http://localhost:3000/buy-voucher
2. Use your email address
3. Complete payment with test card: `4242 4242 4242 4242`
4. Check your inbox for the voucher email!

## Troubleshooting

**"Invalid login":**
- Make sure 2-Step Verification is enabled
- Use App Password, not your regular Gmail password
- Remove spaces from the app password in .env

**"Connection timeout":**
- Check your firewall allows outbound connections on port 587
- Try port 465 with `SMTP_SECURE=true`

**Email goes to spam:**
- Add "noreply@greenpay.gov.pg" to your contacts
- Check spam folder
- This is normal for development - production domain will have better deliverability
