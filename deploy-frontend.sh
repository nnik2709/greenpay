#!/bin/bash
# Deploy frontend to GreenPay server

echo "========================================="
echo "GreenPay Frontend Deployment"
echo "========================================="

# Step 1: Verify local build exists
echo ""
echo "Step 1: Verifying local build..."
if [ ! -d "/Users/nikolay/github/greenpay/dist" ]; then
  echo "❌ Build directory not found. Run 'npm run build' first."
  exit 1
fi

echo "✅ Build directory found"
echo "Build size: $(du -sh /Users/nikolay/github/greenpay/dist | cut -f1)"

# Step 2: Create tarball for faster transfer
echo ""
echo "Step 2: Creating tarball..."
cd /Users/nikolay/github/greenpay
tar -czf dist.tar.gz dist/
echo "✅ Tarball created"

# Step 3: Copy to server
echo ""
echo "Step 3: Copying to server..."
scp -i ~/.ssh/nikolay dist.tar.gz root@72.61.208.79:/tmp/

# Step 4: Extract and deploy on server
echo ""
echo "Step 4: Deploying on server..."
ssh -i ~/.ssh/nikolay root@72.61.208.79 << 'ENDSSH'
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud

# Backup current frontend
if [ -d "frontend" ]; then
  echo "Creating backup..."
  mv frontend frontend.backup.$(date +%Y%m%d_%H%M%S)
fi

# Extract new build
echo "Extracting new build..."
tar -xzf /tmp/dist.tar.gz
mv dist frontend

# Clean up
rm /tmp/dist.tar.gz

echo "✅ Frontend deployed"
ls -lh frontend/
ENDSSH

# Step 5: Clean up local tarball
echo ""
echo "Step 5: Cleaning up..."
rm dist.tar.gz

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "Visit: https://greenpay.eywademo.cloud"
echo "Do a hard refresh: Cmd+Shift+R"
