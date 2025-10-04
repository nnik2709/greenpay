#!/bin/bash

# PNG Green Fees - Environment Setup Script
# Run this script on the VPS to configure Supabase environment variables

set -e  # Exit on any error

VPS_IP="195.200.14.62"
APP_NAME="png-green-fees"
APP_DIR="/var/www/$APP_NAME"

echo "🔧 Setting up Supabase environment variables..."

# Check if we're running on the VPS
if [ "$(hostname -I | awk '{print $1}')" != "$VPS_IP" ]; then
    echo "⚠️  This script should be run on the VPS ($VPS_IP)"
    echo "   Connect via: ssh root@$VPS_IP"
    echo "   Then run this script on the VPS"
    exit 1
fi

echo "📝 Please provide your Supabase credentials:"
echo ""

# Get Supabase URL
read -p "Enter your Supabase URL (e.g., https://your-project-ref.supabase.co): " SUPABASE_URL

# Get Supabase Anon Key
read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY

# Validate inputs
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Both Supabase URL and Anon Key are required!"
    exit 1
fi

echo ""
echo "📝 Creating .env.production file..."

# Create environment file
cat > $APP_DIR/.env.production << EOF
# Production Environment Variables
NODE_ENV=production

# Supabase Configuration
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF

# Set proper permissions
chown www-data:www-data $APP_DIR/.env.production
chmod 600 $APP_DIR/.env.production

echo "✅ Environment variables configured successfully!"
echo ""
echo "📁 Environment file created at: $APP_DIR/.env.production"
echo "🔒 File permissions set to 600 (owner read/write only)"
echo ""
echo "🎯 Next steps:"
echo "1. Rebuild the application with: ./build-production.sh"
echo "2. Upload the new build to VPS"
echo "3. Restart Nginx: systemctl restart nginx"
echo ""
echo "🔍 To verify environment variables:"
echo "   cat $APP_DIR/.env.production"
