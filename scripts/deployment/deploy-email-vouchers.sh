#!/bin/bash

# Deploy Email Corporate Vouchers Feature
# Adds functionality to email vouchers to corporate customers with QR codes

echo "📧 Deploying Email Corporate Vouchers Feature"
echo "=============================================="
echo ""
echo "Feature: Email vouchers to corporate customers"
echo "- Generate PDF with QR codes (4 vouchers per page)"
echo "- Professional HTML email template"
echo "- Single-use voucher enforcement"
echo "- Customer can print and distribute"
echo ""

# Upload updated package.json with qrcode dependency
echo "📦 Uploading package.json with qrcode dependency..."
scp backend/package.json root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/

if [ $? -ne 0 ]; then
    echo "❌ Upload failed"
    exit 1
fi

echo "✅ package.json uploaded"
echo ""

# Upload updated vouchers.js route
echo "📤 Uploading updated vouchers.js route..."
scp backend/routes/vouchers.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

if [ $? -ne 0 ]; then
    echo "❌ Upload failed"
    exit 1
fi

echo "✅ vouchers.js uploaded"
echo ""

# Install qrcode dependency on server
echo "📦 Installing qrcode dependency on server..."
ssh root@72.61.208.79 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend && npm install qrcode@^1.5.3"

if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi

echo "✅ qrcode dependency installed"
echo ""

# Restart backend
echo "🔄 Restarting backend..."
ssh root@72.61.208.79 "pm2 restart greenpay-api"

if [ $? -ne 0 ]; then
    echo "❌ Restart failed"
    exit 1
fi

echo "✅ Backend restarted"
echo ""

# Check status
echo "🔍 Checking backend status..."
ssh root@72.61.208.79 "pm2 list | grep greenpay-api"

echo ""
echo "✅ Email Corporate Vouchers Feature Deployed!"
echo ""
echo "Backend Changes:"
echo "  - Added POST /api/vouchers/email-vouchers endpoint"
echo "  - Generates PDF with large QR codes (one voucher per page)"
echo "  - Sends professional HTML email with PDF attachment"
echo "  - Includes detailed instructions for corporate customers"
echo "  - Validates SMTP configuration (returns 503 if not configured)"
echo ""
echo "Frontend Changes (already completed locally):"
echo "  - Added email input field on Corporate Exit Pass success page"
echo "  - Added 'Email Vouchers' button"
echo "  - Shows instructions about printable PDF and single-use vouchers"
echo "  - Toast notifications for success/error"
echo ""
echo "Voucher Workflow:"
echo "  1. Counter agent generates bulk corporate vouchers"
echo "  2. Agent enters corporate customer's email address"
echo "  3. System emails PDF with vouchers (QR codes)"
echo "  4. Corporate customer prints vouchers and distributes to employees"
echo "  5. Employees present vouchers at airport exit"
echo "  6. Airport staff scans QR code"
echo "  7. System validates voucher (not used, not expired)"
echo "  8. System marks voucher as used (redeemed_date = NOW())"
echo "  9. Voucher cannot be reused"
echo ""
echo "Testing:"
echo "  1. Generate corporate vouchers in the app"
echo "  2. Enter recipient email and click 'Email Vouchers'"
echo "  3. Check email for PDF attachment"
echo "  4. Verify PDF contains one voucher per page with large QR codes"
echo "  5. Test scanning QR code to validate voucher"
echo ""
echo "Note: Ensure SMTP is configured in .env file:"
echo "  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM"
echo ""
