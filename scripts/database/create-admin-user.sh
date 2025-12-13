#!/bin/bash

# Create Admin User for GreenPay
# This script generates the commands needed to create an admin user

set -e

echo "=================================================="
echo "🔐 GreenPay - Create Admin User"
echo "=================================================="
echo ""

# Generate password hash
echo "Step 1: Generating password hash for 'Admin123!'..."
echo ""

# Create temporary Node.js script on the server
cat > /tmp/hash-password.js << 'EOF'
const bcrypt = require('bcryptjs');
const password = 'Admin123!';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('Generated hash:');
  console.log(hash);
  console.log('');
  console.log('SQL Command to create admin user:');
  console.log('');
  console.log('INSERT INTO "User" (name, email, "passwordHash", "roleId", "isActive")');
  console.log(`VALUES ('Admin User', 'admin@greenpay.com', '${hash}', 1, true);`);
  console.log('');
  console.log('Test credentials:');
  console.log('  Email: admin@greenpay.com');
  console.log('  Password: Admin123!');
});
EOF

echo "✅ Created hash script at /tmp/hash-password.js"
echo ""
echo "=================================================="
echo "📋 MANUAL STEPS TO COMPLETE"
echo "=================================================="
echo ""
echo "1. SSH into the server:"
echo "   ssh root@72.61.208.79"
echo ""
echo "2. Navigate to backend directory:"
echo "   cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"
echo ""
echo "3. Copy and run the hash script:"
echo "   cat > /tmp/hash-password.js << 'EOF'"
echo "   const bcrypt = require('bcryptjs');"
echo "   const password = 'Admin123!';"
echo "   bcrypt.hash(password, 10, (err, hash) => {"
echo "     if (err) { console.error('Error:', err); process.exit(1); }"
echo "     console.log('Hash:', hash);"
echo "     console.log('');"
echo "     console.log('Now run this SQL:');"
echo "     console.log('');"
echo "     console.log('INSERT INTO \"User\" (name, email, \"passwordHash\", \"roleId\", \"isActive\")');"
echo "     console.log(\`VALUES ('Admin User', 'admin@greenpay.com', '\${hash}', 1, true);\`);"
echo "   });"
echo "   EOF"
echo ""
echo "   node /tmp/hash-password.js"
echo ""
echo "4. Connect to PostgreSQL:"
echo "   PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db"
echo ""
echo "5. Copy the INSERT statement from step 3 output and paste it into psql"
echo ""
echo "6. Verify the user was created:"
echo "   SELECT id, name, email, \"roleId\", \"isActive\" FROM \"User\" WHERE email = 'admin@greenpay.com';"
echo ""
echo "7. Exit psql:"
echo "   \\q"
echo ""
echo "=================================================="
echo "🧪 TESTING"
echo "=================================================="
echo ""
echo "After creating the user, test login at:"
echo "  https://greenpay.eywademo.cloud/login"
echo ""
echo "Credentials:"
echo "  Email: admin@greenpay.com"
echo "  Password: Admin123!"
echo ""
