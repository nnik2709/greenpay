# 🚀 Quick Deploy Reference

## Local Setup & Build
```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables (optional)
echo "VITE_SUPABASE_URL=https://your-project-ref.supabase.co" > .env.production
echo "VITE_SUPABASE_ANON_KEY=your_anon_key_here" >> .env.production

# 3. Run tests (optional)
npm run test:local

# 4. Build for production
./build-production.sh
```

## Deploy to VPS (195.200.14.62)

### Option 1: Automated (Recommended)
```bash
# Upload and deploy automatically
./upload-to-vps.sh
```

### Option 2: Manual
```bash
# 1. Connect to VPS
ssh root@195.200.14.62

# 2. Run deployment script (first time only)
./deploy-vps.sh

# 3. Upload files from local machine
scp -r dist/ root@195.200.14.62:/var/www/png-green-fees/
```

## Update Application
```bash
# 1. Build new version
./build-production.sh

# 2. Upload to VPS
./upload-to-vps.sh
```

## Test Application
```bash
# Test local development
./test-deployment.sh local

# Test production
./test-deployment.sh remote

# Test both environments
./test-deployment.sh all
```

## Check Status
```bash
# On VPS
systemctl status nginx
curl -I https://eywademo.cloud
```

## URLs
- **Production**: https://eywademo.cloud
- **WWW**: https://www.eywademo.cloud
- **IP**: http://195.200.14.62

## Troubleshooting
```bash
# Check logs
tail -f /var/log/nginx/error.log

# Restart Nginx
systemctl restart nginx

# Check permissions
chown -R www-data:www-data /var/www/png-green-fees/
```
