# Server Deployment Checklist - PNG Invoice System

## What Needs to Be Done on the Server

### 1. ✅ Database Migration (You mentioned this is done)
```bash
./deploy-invoice-system.sh
```
This creates:
- invoices table
- invoice_payments table
- Updates quotations table
- Updates corporate_vouchers table

---

### 2. 🔧 Backend API Routes (REQUIRED)

#### Upload New Backend File
The new invoice routes file needs to be uploaded to the server:

**File to upload**:
- `backend/routes/invoices-gst.js` → Server: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`

**Command**:
```bash
scp backend/routes/invoices-gst.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
```

#### Register Routes in server.js
The backend server needs to know about the new invoice routes.

**File to edit on server**: `backend/server.js`

**Add this line** (after other route registrations):
```javascript
const invoicesRouter = require('./routes/invoices-gst');
app.use('/api/invoices', invoicesRouter);
```

**Full example in context**:
```javascript
// Existing routes
const authRouter = require('./routes/auth');
const passportsRouter = require('./routes/passports');
const quotationsRouter = require('./routes/quotations');
const individualPurchasesRouter = require('./routes/individual-purchases');
// ... other routes ...

// ADD THIS:
const invoicesRouter = require('./routes/invoices-gst');

// Route registrations
app.use('/api/auth', authRouter);
app.use('/api/passports', passportsRouter);
app.use('/api/quotations', quotationsRouter);
app.use('/api/individual-purchases', individualPurchasesRouter);
// ... other route registrations ...

// ADD THIS:
app.use('/api/invoices', invoicesRouter);
```

#### Restart Backend
After adding the routes, restart the backend:
```bash
ssh root@72.61.208.79 "pm2 restart greenpay-api"
```

---

### 3. 🌐 Frontend Build & Deployment (REQUIRED)

#### Build Frontend Locally
```bash
npm run build
```

This creates the `dist/` folder with all compiled assets including:
- New Invoices page
- Updated Quotations page
- GST utilities
- Invoice service

#### Upload to Server
```bash
scp -r dist/* root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/
```

Or using rsync (better, avoids overwrites):
```bash
rsync -avz --delete dist/ root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/
```

---

### 4. 📝 Update Frontend Routes (REQUIRED - Before Building)

Before building, you need to add the invoice routes to your frontend app.

#### File 1: `src/App.jsx`
Add the invoice route:

```javascript
import Invoices from '@/pages/Invoices';

// In your routes section:
<Route path="/invoices" element={
  <PrivateRoute roles={['Flex_Admin', 'Finance_Manager', 'IT_Support']}>
    <Invoices />
  </PrivateRoute>
} />
```

#### File 2: `src/components/Header.jsx`
Add "Invoices" to the navigation menu:

```javascript
// Add to your menu items:
{
  to: '/invoices',
  label: 'Invoices',
  roles: ['Flex_Admin', 'Finance_Manager', 'IT_Support']
}
```

---

## Complete Server Deployment Steps

### Step-by-Step Guide:

#### BEFORE DEPLOYING:
1. ✅ Add routes to `src/App.jsx` (locally)
2. ✅ Add menu to `src/components/Header.jsx` (locally)
3. ✅ Build frontend: `npm run build` (locally)

#### ON SERVER:
4. ✅ Run database migration (you said this is done)
5. ⏳ Upload backend invoice routes file
6. ⏳ Edit `backend/server.js` to register routes
7. ⏳ Restart PM2: `pm2 restart greenpay-api`
8. ⏳ Upload frontend build (`dist/` folder)
9. ⏳ Clear browser cache / hard refresh

---

## Detailed Commands

### Backend Deployment:
```bash
# 1. Upload invoice routes
scp backend/routes/invoices-gst.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# 2. SSH into server and edit server.js
ssh root@72.61.208.79
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
nano server.js
# Add the two lines mentioned above
# Save and exit (Ctrl+X, Y, Enter)

# 3. Restart backend
pm2 restart greenpay-api

# 4. Check logs for errors
pm2 logs greenpay-api --lines 50
```

### Frontend Deployment:
```bash
# 1. Build locally (AFTER adding routes to App.jsx and Header.jsx)
npm run build

# 2. Upload to server
rsync -avz --delete dist/ root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/

# OR using scp:
scp -r dist/* root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/
```

---

## Verification Steps

After deployment, test:

1. **Backend API Test**:
```bash
# Test if invoice routes are registered
curl http://greenpay.eywademo.cloud/api/invoices/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should return invoice statistics or 401 if not logged in
```

2. **Frontend Test**:
- Login to the application
- Navigate to `/invoices` - Should see the Invoices page
- Go to Quotations page
- Approve a quotation
- Click "Convert to Invoice" button - Should see modal
- Create invoice - Should navigate to Invoices page

---

## What's Different from Before

**NEW Backend Files:**
- `backend/routes/invoices-gst.js` (NEW - needs upload)

**UPDATED Backend Files:**
- `backend/server.js` (needs 2 lines added)

**NEW Frontend Files:**
- `src/pages/Invoices.jsx` (NEW - in build)
- `src/lib/invoiceService.js` (NEW - in build)
- `src/lib/gstUtils.js` (NEW - in build)

**UPDATED Frontend Files:**
- `src/pages/Quotations.jsx` (UPDATED - in build)
- `src/App.jsx` (needs invoice route added)
- `src/components/Header.jsx` (needs menu item added)

---

## Summary: What YOU Need to Do

### On Your Local Machine:
1. ✅ Add invoice route to `src/App.jsx`
2. ✅ Add menu item to `src/components/Header.jsx`
3. ✅ Run `npm run build`

### On the Server:
4. ✅ Database migration (you mentioned done)
5. ⏳ Upload `backend/routes/invoices-gst.js`
6. ⏳ Edit `backend/server.js` (add 2 lines)
7. ⏳ Restart PM2: `pm2 restart greenpay-api`
8. ⏳ Upload `dist/` folder

### Testing:
9. ⏳ Login and test the workflow
10. ⏳ Check browser console for errors
11. ⏳ Check PM2 logs for backend errors

---

## Quick Deploy Script

I can create a deployment script for you that does all backend steps automatically.

Would you like me to create:
1. `deploy-invoice-backend.sh` - Uploads backend files and restarts PM2
2. `deploy-invoice-frontend.sh` - Builds and uploads frontend

Let me know!

---

**Last Updated**: November 27, 2025
**Status**: Ready for server deployment
