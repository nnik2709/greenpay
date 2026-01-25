#!/bin/bash
# Check and verify SMTP configuration for GreenPay
# Date: January 25, 2026

echo "🔍 Checking SMTP Configuration for GreenPay API..."
echo ""

# Check if running on production server
if [ -d "/var/www/greenpay" ]; then
  APP_DIR="/var/www/greenpay"
else
  echo "❌ /var/www/greenpay not found. Are you on the production server?"
  exit 1
fi

echo "📂 Application Directory: $APP_DIR"
echo ""

# Check for .env file
if [ -f "$APP_DIR/.env" ]; then
  echo "✅ Found .env file"
  echo ""
  echo "📧 SMTP Configuration in .env:"
  echo "----------------------------------------"
  grep "^SMTP" "$APP_DIR/.env" || echo "⚠️  No SMTP variables found in .env"
  echo "----------------------------------------"
  echo ""
else
  echo "⚠️  No .env file found at $APP_DIR/.env"
  echo ""
fi

# Check ecosystem.config.js
if [ -f "$APP_DIR/ecosystem.config.js" ]; then
  echo "✅ Found ecosystem.config.js"
  echo ""
  echo "📧 Checking for SMTP in ecosystem config:"
  echo "----------------------------------------"
  grep -i "smtp" "$APP_DIR/ecosystem.config.js" || echo "⚠️  No SMTP variables found in ecosystem.config.js"
  echo "----------------------------------------"
  echo ""
else
  echo "⚠️  No ecosystem.config.js found"
  echo ""
fi

# Check what PM2 process sees
echo "🔍 Checking PM2 environment for greenpay-api (ID: 2):"
echo "----------------------------------------"
pm2 show 2 | grep -A 20 "env:" || echo "⚠️  Could not get PM2 environment"
echo "----------------------------------------"
echo ""

# Recommendations
echo "📝 REQUIRED SMTP Environment Variables:"
echo "----------------------------------------"
echo "SMTP_HOST=smtp-relay.brevo.com"
echo "SMTP_PORT=587"
echo "SMTP_SECURE=false"
echo "SMTP_USER=a0282b001@smtp-brevo.com"
echo "SMTP_PASS=<your-api-key>"
echo "SMTP_FROM=noreply@greenpay.eywademo.cloud  ⬅️  CRITICAL!"
echo "SMTP_FROM_NAME=PNG Green Fees System"
echo "----------------------------------------"
echo ""

echo "💡 To set SMTP_FROM if missing:"
echo ""
echo "Option 1: Add to .env file:"
echo "  echo 'SMTP_FROM=noreply@greenpay.eywademo.cloud' >> $APP_DIR/.env"
echo "  pm2 restart greenpay-api --update-env"
echo ""
echo "Option 2: Add to ecosystem.config.js env section and restart"
echo ""
