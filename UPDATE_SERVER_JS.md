# How to Update server.js

## Location

The `server.js` file is on the production server at:
```
/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js
```

## What You Need to Add

You need to register two new routes in server.js:

1. Payment Modes route: `/api/payment-modes`
2. Tickets route: `/api/tickets`

## Step-by-Step Instructions

### Option 1: Manual Edit (Recommended)

1. **SSH to server:**
   ```bash
   ssh -i ~/.ssh/nikolay root@72.61.208.79
   ```

2. **Open server.js in nano:**
   ```bash
   nano /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js
   ```

3. **Find the settings route** - Look for a line like this:
   ```javascript
   app.use('/api/settings', require('./routes/settings'));
   ```

4. **Add these TWO lines RIGHT AFTER the settings route:**
   ```javascript
   app.use('/api/payment-modes', require('./routes/payment-modes'));
   app.use('/api/tickets', require('./routes/tickets'));
   ```

5. **The section should look like this:**
   ```javascript
   app.use('/api/settings', require('./routes/settings'));
   app.use('/api/payment-modes', require('./routes/payment-modes'));
   app.use('/api/tickets', require('./routes/tickets'));
   ```

6. **Save the file:**
   - Press `Ctrl+O` (save)
   - Press `Enter` (confirm)
   - Press `Ctrl+X` (exit)

7. **Restart the backend:**
   ```bash
   pm2 restart greenpay-api
   ```

8. **Check logs to verify no errors:**
   ```bash
   pm2 logs greenpay-api --lines 20
   ```

   You should see:
   - ✅ "Server running on port 3001" (or similar)
   - ❌ No error messages about payment-modes or tickets

### Option 2: Automated Script

Alternatively, create and run this script on the server:

```bash
# On the server, create update script
cat > /tmp/update-routes.sh << 'SCRIPT'
#!/bin/bash

SERVER_FILE="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js"

# Check if routes already registered
if grep -q "payment-modes" "$SERVER_FILE" && grep -q "tickets" "$SERVER_FILE"; then
  echo "✅ Routes already registered"
  exit 0
fi

# Backup server.js
cp "$SERVER_FILE" "$SERVER_FILE.backup.$(date +%Y%m%d_%H%M%S)"

# Add payment-modes route if not present
if ! grep -q "payment-modes" "$SERVER_FILE"; then
  sed -i "/app\.use('\/api\/settings'/a app.use('/api/payment-modes', require('./routes/payment-modes'));" "$SERVER_FILE"
  echo "✅ Added payment-modes route"
fi

# Add tickets route if not present
if ! grep -q "tickets" "$SERVER_FILE"; then
  sed -i "/app\.use('\/api\/payment-modes'/a app.use('/api/tickets', require('./routes/tickets'));" "$SERVER_FILE"
  echo "✅ Added tickets route"
fi

echo "✅ Routes registered successfully"

# Show the relevant section
echo ""
echo "Updated section:"
grep -A 2 "api/settings" "$SERVER_FILE"
SCRIPT

chmod +x /tmp/update-routes.sh
/tmp/update-routes.sh
```

## What These Routes Do

### `/api/payment-modes`
Handles payment mode management:
- `GET /api/payment-modes` - List all payment modes
- `POST /api/payment-modes` - Create new payment mode
- `PUT /api/payment-modes/:id` - Update payment mode
- `DELETE /api/payment-modes/:id` - Delete payment mode

### `/api/tickets`
Handles support ticket system:
- `GET /api/tickets` - List all tickets (role-based)
- `GET /api/tickets/:id` - Get single ticket with responses
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/:id` - Update ticket status
- `POST /api/tickets/:id/responses` - Add response to ticket
- `DELETE /api/tickets/:id` - Delete ticket (admin only)

## Verification

After updating and restarting, test the endpoints:

```bash
# Test payment-modes endpoint (should return 401 without auth)
curl https://greenpay.eywademo.cloud/api/payment-modes

# Test tickets endpoint (should return 401 without auth)
curl https://greenpay.eywademo.cloud/api/tickets
```

Expected response: `{"error":"No token provided"}` - This is GOOD! It means the route exists and authentication is working.

If you get 404, the route is not registered properly.

## Troubleshooting

### If you see errors in PM2 logs:

**Error: Cannot find module './routes/payment-modes'**
- The payment-modes.js file is missing from backend/routes/
- Copy it: `scp -i ~/.ssh/nikolay /Users/nikolay/github/greenpay/payment-modes.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/payment-modes.js`

**Error: Cannot find module './routes/tickets'**
- The tickets.js file is missing from backend/routes/
- Copy it: `scp -i ~/.ssh/nikolay /Users/nikolay/github/greenpay/tickets.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/tickets.js`

**Error: relation "PaymentMode" does not exist**
- Run the PaymentMode table creation SQL (see DEPLOYMENT_READY_2025-11-26.md)

**Error: relation "Ticket" does not exist**
- Run the create-tickets-tables.sql migration
