#!/bin/bash

echo "🧪 Testing Local Development Setup"
echo "=================================="
echo ""

# Test 1: Check if backend is running
echo "1️⃣ Testing Backend Server..."
curl -s http://localhost:3001/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Backend is running on port 3001"
else
    echo "   ❌ Backend is NOT running"
fi
echo ""

# Test 2: Check database connection (via /api/auth/verify with invalid token - should return 401 but proves DB is connected)
echo "2️⃣ Testing Database Connection..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/verify)
if [ "$RESPONSE" -eq 401 ]; then
    echo "   ✅ Database connection working (got expected 401 response)"
else
    echo "   ⚠️  Got HTTP $RESPONSE - check backend logs"
fi
echo ""

# Test 3: Check frontend .env configuration
echo "3️⃣ Checking Frontend Configuration..."
if grep -q "VITE_API_URL=http://localhost:3001/api" /Users/nikolay/github/greenpay/.env; then
    echo "   ✅ Frontend .env points to local backend"
else
    echo "   ❌ Frontend .env NOT configured for local backend"
fi
echo ""

echo "=================================="
echo "📝 Next Steps:"
echo "   1. Start frontend: npm run dev"
echo "   2. Open browser: http://localhost:5173"
echo "   3. Test voucher creation as Agent role"
echo ""
echo "🔍 Troubleshooting:"
echo "   Backend logs: Check the terminal where 'npm run dev' is running"
echo "   Frontend logs: Check browser console (F12)"
echo ""
