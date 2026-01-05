#!/bin/bash

# Deploy Python OCR Service Fix
# Fixes: 'FastMRZ' object has no attribute 'parse'

echo "=== Deploying Python OCR Service Fix ==="
echo ""

# Step 1: Upload fixed mrz_parser.py
echo "Step 1: Upload mrz_parser.py via CloudPanel"
echo "  Source: /Users/nikolay/github/greenpay/python-ocr-service/app/mrz_parser.py"
echo "  Destination: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/python-ocr-service/app/mrz_parser.py"
echo ""
echo "Press Enter after uploading via CloudPanel..."
read

# Step 2: SSH commands to restart service
echo ""
echo "Step 2: Copy and paste these commands in your SSH terminal:"
echo ""
echo "# Navigate to Python OCR service directory"
echo "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/python-ocr-service"
echo ""
echo "# Restart the Python OCR service"
echo "pm2 restart greenpay-ocr"
echo ""
echo "# Monitor logs to verify fix"
echo "pm2 logs greenpay-ocr --lines 50"
echo ""
echo "# You should see: 'MRZ parser initialized' (NOT 'FastMRZ parser initialized')"
echo "# Test by scanning a passport - should see: 'Successfully parsed MRZ for passport: XXXXXXXX'"
echo ""

echo "=== Deployment Commands Ready ==="
echo "Paste the above commands in SSH and test!"
