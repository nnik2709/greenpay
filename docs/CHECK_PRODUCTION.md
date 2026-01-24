# Production CSS Missing - Debugging Commands

## Run these commands to diagnose:

```bash
# 1. Check if CSS file exists on production
ssh root@165.22.52.100 "ls -lh /var/www/png-green-fees/dist/assets/*.css"

# 2. Check if index.html references correct CSS
ssh root@165.22.52.100 "grep 'stylesheet' /var/www/png-green-fees/dist/index.html"

# 3. Check nginx configuration
ssh root@165.22.52.100 "nginx -T 2>&1 | grep -A 10 'greenpay.eywademo.cloud'"

# 4. Test CSS file accessibility
ssh root@165.22.52.100 "curl -I https://greenpay.eywademo.cloud/assets/index-BkXVrK0-.css"

# 5. Check PM2 status
ssh root@165.22.52.100 "pm2 status"

# 6. Check PM2 config for png-green-fees
ssh root@165.22.52.100 "pm2 describe png-green-fees"
```

## Most Likely Issues:

1. **Old dist folder** - You didn't fully replace dist/
2. **Nginx caching** - Nginx serving old cached CSS
3. **Wrong path** - PM2 serving from different directory
4. **MIME type issue** - CSS not served with correct Content-Type

## Quick Fix:

```bash
# Clear everything and redeploy
ssh root@165.22.52.100 "rm -rf /var/www/png-green-fees/dist && mkdir -p /var/www/png-green-fees/dist"
scp -r dist/* root@165.22.52.100:/var/www/png-green-fees/dist/
ssh root@165.22.52.100 "pm2 restart png-green-fees && nginx -s reload"
```
