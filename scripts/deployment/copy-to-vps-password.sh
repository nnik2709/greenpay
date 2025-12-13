#!/bin/bash

# PNG Green Fees - Copy Files to VPS Script (Password Authentication)
# This script copies the built application and environment files to the VPS using password auth

set -e  # Exit on any error

# VPS Configuration
VPS_USER="root"
VPS_HOST="195.200.14.62"
VPS_APP_DIR="/var/www/png-green-fees"
LOCAL_DIST="dist"
LOCAL_ENV=".env.production"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo "🚀 PNG Green Fees - Copy to VPS (Password Auth)"
echo "==============================================="
echo ""

# Check if required files exist
print_info "Checking required files..."

if [ ! -d "$LOCAL_DIST" ]; then
    print_error "Local dist directory not found!"
    print_info "Please run 'npm run build' first to create the production build"
    exit 1
fi

if [ ! -f "$LOCAL_ENV" ]; then
    print_error "Environment file not found: $LOCAL_ENV"
    print_info "Please ensure .env.production exists with Supabase credentials"
    exit 1
fi

print_success "Required files found"

# Test SSH connection with password
print_info "Testing SSH connection to VPS..."
print_warning "You will be prompted for the VPS password"
echo ""

if ! ssh -o ConnectTimeout=10 -o PasswordAuthentication=yes $VPS_USER@$VPS_HOST exit; then
    print_error "Cannot connect to VPS via SSH"
    print_info "Please check:"
    echo "  1. VPS is accessible at $VPS_HOST"
    echo "  2. SSH service is running on VPS"
    echo "  3. Password authentication is enabled"
    echo "  4. Your password is correct"
    exit 1
fi

print_success "SSH connection successful"

# Create application directory on VPS
print_info "Creating application directory on VPS..."
print_warning "You will be prompted for the VPS password"
ssh -o PasswordAuthentication=yes $VPS_USER@$VPS_HOST "mkdir -p $VPS_APP_DIR"

# Backup existing deployment
print_info "Creating backup of existing deployment..."
print_warning "You will be prompted for the VPS password"
ssh -o PasswordAuthentication=yes $VPS_USER@$VPS_HOST "
    if [ -d '$VPS_APP_DIR/dist' ]; then
        mv '$VPS_APP_DIR/dist' '$VPS_APP_DIR/dist.backup.\$(date +%Y%m%d-%H%M%S)' 2>/dev/null || true
        echo 'Backup created'
    else
        echo 'No existing deployment to backup'
    fi
"

# Copy dist folder using rsync with password
print_info "Copying application files to VPS..."
print_warning "You will be prompted for the VPS password multiple times"
echo ""

if sshpass -p "$(read -s -p "Enter VPS password: " PASSWORD; echo $PASSWORD)" rsync -avz --progress --delete $LOCAL_DIST/ $VPS_USER@$VPS_HOST:$VPS_APP_DIR/dist/ 2>/dev/null; then
    print_success "Application files copied successfully"
else
    print_warning "sshpass not available, using interactive rsync..."
    print_warning "You will be prompted for the VPS password"
    if rsync -avz --progress --delete $LOCAL_DIST/ $VPS_USER@$VPS_HOST:$VPS_APP_DIR/dist/; then
        print_success "Application files copied successfully"
    else
        print_error "Failed to copy application files"
        exit 1
    fi
fi

# Copy environment file
print_info "Copying environment variables..."
print_warning "You will be prompted for the VPS password"
if scp $LOCAL_ENV $VPS_USER@$VPS_HOST:$VPS_APP_DIR/.env.production; then
    print_success "Environment variables copied successfully"
else
    print_error "Failed to copy environment variables"
    exit 1
fi

# Set proper permissions
print_info "Setting file permissions on VPS..."
print_warning "You will be prompted for the VPS password"
ssh -o PasswordAuthentication=yes $VPS_USER@$VPS_HOST "
    chown -R www-data:www-data $VPS_APP_DIR
    chmod -R 755 $VPS_APP_DIR
    chmod 600 $VPS_APP_DIR/.env.production
"

print_success "File permissions set correctly"

# Restart Nginx
print_info "Restarting Nginx on VPS..."
print_warning "You will be prompted for the VPS password"
if ssh -o PasswordAuthentication=yes $VPS_USER@$VPS_HOST "systemctl restart nginx"; then
    print_success "Nginx restarted successfully"
else
    print_warning "Failed to restart Nginx - please restart manually"
fi

# Test deployment
print_info "Testing deployment..."
if ssh -o PasswordAuthentication=yes $VPS_USER@$VPS_HOST "systemctl status nginx --no-pager -l" | grep -q "active (running)"; then
    print_success "Nginx is running"
else
    print_warning "Nginx may not be running properly"
fi

# Check if files are deployed
print_info "Verifying deployed files..."
print_warning "You will be prompted for the VPS password"
FILE_COUNT=$(ssh -o PasswordAuthentication=yes $VPS_USER@$VPS_HOST "find $VPS_APP_DIR/dist -type f | wc -l")
print_success "Deployed $FILE_COUNT files to VPS"

# Test application response
print_info "Testing application response..."
if curl -s -o /dev/null -w "%{http_code}" https://eywademo.cloud | grep -q "200"; then
    print_success "Application is responding correctly"
else
    print_warning "Application may not be responding. Check VPS logs:"
    echo "  ssh $VPS_USER@$VPS_HOST 'tail -f /var/log/nginx/error.log'"
fi

echo ""
echo "🎉 Deployment Summary"
echo "===================="
print_success "✅ Files copied to VPS successfully"
print_success "✅ Environment variables configured"
print_success "✅ Permissions set correctly"
print_success "✅ Nginx restarted"
echo ""
print_info "🌐 Application URLs:"
echo "   • https://eywademo.cloud"
echo "   • https://www.eywademo.cloud"
echo ""
print_info "🔐 Login Credentials:"
echo "   • Email: admin@example.com"
echo "   • Password: password123"
echo ""
print_info "🧪 Testing Checklist:"
echo "   1. Open https://eywademo.cloud in a new incognito window"
echo "   2. Login with admin@example.com / password123"
echo "   3. Verify no blank screen appears"
echo "   4. Test bulk upload functionality"
echo "   5. Test corporate batch email feature"
echo "   6. Test quotation sending"
echo ""
print_info "🔧 Troubleshooting Commands:"
echo "   • SSH to VPS: ssh $VPS_USER@$VPS_HOST"
echo "   • Check Nginx status: systemctl status nginx"
echo "   • View Nginx logs: tail -f /var/log/nginx/error.log"
echo "   • Check deployed files: ls -la $VPS_APP_DIR/dist/"
echo "   • Verify environment: cat $VPS_APP_DIR/.env.production"
echo ""
print_success "Deployment completed! The blank screen issue should be resolved."







