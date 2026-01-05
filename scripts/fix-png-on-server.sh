#!/bin/bash
# Run this script ON THE SERVER

cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/assets/logos/

echo "Current PNG file status:"
file png-emblem.png

echo ""
echo "Downloading valid PNG emblem..."
curl -L "https://flagpedia.net/data/flags/normal/pg.png" -o png-emblem.png

echo ""
echo "New PNG file status:"
file png-emblem.png

echo ""
echo "Restarting backend..."
pm2 restart greenpay-api

echo ""
echo "✅ Done! Download a new PDF to test."
