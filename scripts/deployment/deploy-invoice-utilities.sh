#!/bin/bash

# Deploy invoice PDF and email utilities to fix backend crash
# Fixes MODULE_NOT_FOUND errors for pdfGenerator and emailService

echo "🔧 Deploying Invoice Utilities"
echo "=============================="
echo ""
echo "Uploading missing utilities that were causing backend crash:"
echo "  - backend/utils/pdfGenerator.js (PDF generation with PDFKit)"
echo "  - backend/utils/emailService.js (Email sending with Nodemailer)"
echo "  - backend/routes/invoices-gst.js (updated to use utilities)"
echo ""

# Upload pdfGenerator.js
echo "📤 Uploading pdfGenerator.js..."
rsync -avz backend/utils/pdfGenerator.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/

if [ $? -ne 0 ]; then
    echo "❌ Failed to upload pdfGenerator.js"
    exit 1
fi

# Upload emailService.js
echo "📤 Uploading emailService.js..."
rsync -avz backend/utils/emailService.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/

if [ $? -ne 0 ]; then
    echo "❌ Failed to upload emailService.js"
    exit 1
fi

# Upload updated invoices-gst.js
echo "📤 Uploading updated invoices-gst.js..."
rsync -avz backend/routes/invoices-gst.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

if [ $? -ne 0 ]; then
    echo "❌ Failed to upload invoices-gst.js"
    exit 1
fi

echo "✅ All files uploaded"
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
echo "✅ Invoice utilities deployed successfully!"
echo ""
echo "Changes:"
echo "  ✓ Created pdfGenerator.js - Generates PNG GST-compliant tax invoices"
echo "  ✓ Created emailService.js - Sends invoice emails with PDF attachments"
echo "  ✓ Updated invoices-gst.js - Uncommented requires and implemented email route"
echo ""
echo "Notes:"
echo "  - PDF generation uses PDFKit (already in dependencies)"
echo "  - Email service uses Nodemailer (already in dependencies)"
echo "  - Email requires SMTP configuration in .env file"
echo "  - If SMTP not configured, email will return 503 error"
echo ""
echo "Next: Re-run tests to verify backend is working"
echo "  npx playwright test --grep 'authentication'"
echo ""
