# Domain URL Centralization Plan

**Date**: 2026-01-18
**Purpose**: Centralize all hardcoded domain URLs to prepare for domain migration from `greenpay.eywademo.cloud` to `pnggreenfees.gov.pg`

---

## Current Situation

The application currently has hardcoded URLs scattered across **15 source code files** with 2 different domains:
- Current: `https://greenpay.eywademo.cloud`
- Future: `https://pnggreenfees.gov.pg`

---

## Files Requiring Changes

### Frontend (5 files)

| File | Line(s) | Current Code | Type |
|------|---------|--------------|------|
| `src/components/VoucherPrint.jsx` | 39 | `https://greenpay.eywademo.cloud/register/...` | Registration URL |
| `src/lib/api/client.js` | 5 | Fallback for VITE_API_URL | API URL |
| `src/lib/invoicePdfService.js` | 8 | Fallback for VITE_API_URL | API URL |
| `src/lib/quotationPdfService.js` | 8 | Fallback for VITE_API_URL | API URL |
| `src/lib/storageService.js` | 7 | Fallback for VITE_API_URL | API URL |

### Backend (3 files)

| File | Line(s) | Current Code | Type |
|------|---------|--------------|------|
| `backend/utils/pdfGenerator.js` | 157, 584 | `https://greenpay.eywademo.cloud/register/...` | Registration URL |
| `backend/routes/payment-webhook-doku.js` | 481, 494, 500, 506 | Hardcoded redirects | Payment URLs |
| `backend/services/notificationService.js` | 495, 763, 799 | Fallback for PUBLIC_URL | Email URLs |
| `backend/services/payment-gateways/BSPGateway.js` | 252 | Fallback for FRONTEND_URL | Payment callback URL |

---

## Recommended Solution

### Strategy: Use Environment Variables with Centralized Config

Create a **single source of truth** for all domain URLs that can be easily changed.

### Implementation Steps

#### 1. Create Environment Variable Configuration Files

**Frontend: `.env` (already exists, needs update)**
```bash
# Current development/staging
VITE_PUBLIC_URL=https://greenpay.eywademo.cloud
VITE_API_URL=https://greenpay.eywademo.cloud/api

# When migrating to production:
# VITE_PUBLIC_URL=https://pnggreenfees.gov.pg
# VITE_API_URL=https://pnggreenfees.gov.pg/api
```

**Backend: `.env` (server-side)**
```bash
# Current development/staging
PUBLIC_URL=https://greenpay.eywademo.cloud
API_URL=https://greenpay.eywademo.cloud/api
FRONTEND_URL=https://greenpay.eywademo.cloud

# When migrating to production:
# PUBLIC_URL=https://pnggreenfees.gov.pg
# API_URL=https://pnggreenfees.gov.pg/api
# FRONTEND_URL=https://pnggreenfees.gov.pg
```

#### 2. Create Centralized Config Utility

**Frontend: `src/config/urls.js` (NEW FILE)**
```javascript
/**
 * Centralized URL configuration
 * Single source of truth for all domain URLs
 */

// Get public URL from environment variable
export const PUBLIC_URL = import.meta.env.VITE_PUBLIC_URL || 'https://greenpay.eywademo.cloud';

// Get API base URL from environment variable
export const API_URL = import.meta.env.VITE_API_URL || 'https://greenpay.eywademo.cloud/api';

/**
 * Build a public registration URL
 * @param {string} voucherCode - The voucher code
 * @returns {string} Full registration URL
 */
export const getRegistrationUrl = (voucherCode) => {
  return `${PUBLIC_URL}/register/${voucherCode}`;
};

/**
 * Build a payment callback URL
 * @param {string} path - The callback path
 * @returns {string} Full callback URL
 */
export const getPaymentCallbackUrl = (path) => {
  return `${PUBLIC_URL}/payment/${path}`;
};
```

**Backend: `backend/config/urls.js` (NEW FILE)**
```javascript
/**
 * Centralized URL configuration for backend
 * Single source of truth for all domain URLs
 */

// Get URLs from environment variables with fallbacks
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://greenpay.eywademo.cloud';
const API_URL = process.env.API_URL || 'https://greenpay.eywademo.cloud/api';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://greenpay.eywademo.cloud';

/**
 * Build a public registration URL
 * @param {string} voucherCode - The voucher code
 * @returns {string} Full registration URL
 */
const getRegistrationUrl = (voucherCode) => {
  return `${PUBLIC_URL}/register/${voucherCode}`;
};

/**
 * Build a payment callback URL
 * @param {string} path - The callback path
 * @returns {string} Full callback URL
 */
const getPaymentCallbackUrl = (path) => {
  return `${FRONTEND_URL}/payment/${path}`;
};

/**
 * Build an app URL
 * @param {string} path - The app path (e.g., '/tickets', '/dashboard')
 * @returns {string} Full app URL
 */
const getAppUrl = (path) => {
  return `${PUBLIC_URL}/app${path}`;
};

module.exports = {
  PUBLIC_URL,
  API_URL,
  FRONTEND_URL,
  getRegistrationUrl,
  getPaymentCallbackUrl,
  getAppUrl,
};
```

#### 3. Update Frontend Files (5 files)

**File 1: `src/components/VoucherPrint.jsx`** (Line 39)

```javascript
// BEFORE:
const registrationUrl = `https://greenpay.eywademo.cloud/register/${voucher.voucher_code}`;

// AFTER:
import { getRegistrationUrl } from '@/config/urls';
const registrationUrl = getRegistrationUrl(voucher.voucher_code);
```

**Files 2-5: API client files** (Lines vary)

```javascript
// BEFORE:
const API_URL = import.meta.env.VITE_API_URL || 'https://greenpay.eywademo.cloud/api';

// AFTER:
import { API_URL } from '@/config/urls';
```

#### 4. Update Backend Files (3 files)

**File 1: `backend/utils/pdfGenerator.js`** (Lines 157, 584)

```javascript
// Add at top of file:
const { getRegistrationUrl } = require('../config/urls');

// BEFORE (Line 157 and 584):
const registrationUrl = `https://greenpay.eywademo.cloud/register/${voucherCode}`;

// AFTER:
const registrationUrl = getRegistrationUrl(voucherCode);
```

**File 2: `backend/routes/payment-webhook-doku.js`** (Lines 481, 494, 500, 506)

```javascript
// Add at top of file:
const { getPaymentCallbackUrl } = require('../config/urls');

// BEFORE (multiple lines):
res.redirect('https://greenpay.eywademo.cloud/payment/failure?error=Invalid+response');
res.redirect(`https://greenpay.eywademo.cloud/payment/success?session=${encodeURIComponent(TRANSIDMERCHANT)}`);

// AFTER:
res.redirect(getPaymentCallbackUrl(`failure?error=Invalid+response`));
res.redirect(getPaymentCallbackUrl(`success?session=${encodeURIComponent(TRANSIDMERCHANT)}`));
```

**File 3: `backend/services/notificationService.js`** (Lines 495, 763, 799)

```javascript
// Add at top of file:
const { PUBLIC_URL, getAppUrl } = require('../config/urls');

// BEFORE (Line 495):
const publicUrl = process.env.PUBLIC_URL || 'https://greenpay.eywademo.cloud';

// AFTER:
const publicUrl = PUBLIC_URL;

// BEFORE (Line 763):
<a href="${process.env.PUBLIC_URL || 'https://greenpay.eywademo.cloud'}/app/tickets" class="button">View Ticket</a>

// AFTER:
<a href="${getAppUrl('/tickets')}" class="button">View Ticket</a>
```

**File 4: `backend/services/payment-gateways/BSPGateway.js`** (Line 252)

```javascript
// Add at top of file:
const { FRONTEND_URL } = require('../../config/urls');

// BEFORE:
const baseUrl = process.env.FRONTEND_URL || 'https://greenpay.eywademo.cloud';

// AFTER:
const baseUrl = FRONTEND_URL;
```

---

## Migration Process (Domain Switch)

When ready to switch from `greenpay.eywademo.cloud` to `pnggreenfees.gov.pg`:

### Step 1: Update Environment Variables

**Frontend `.env`:**
```bash
VITE_PUBLIC_URL=https://pnggreenfees.gov.pg
VITE_API_URL=https://pnggreenfees.gov.pg/api
```

**Backend `.env` (on server):**
```bash
PUBLIC_URL=https://pnggreenfees.gov.pg
API_URL=https://pnggreenfees.gov.pg/api
FRONTEND_URL=https://pnggreenfees.gov.pg
```

### Step 2: Rebuild Frontend

```bash
npm run build
```

### Step 3: Deploy Both

1. Upload new `dist/` folder (frontend)
2. Update backend `.env` file on server
3. Restart PM2:
   ```bash
   pm2 restart greenpay-api
   pm2 restart png-green-fees
   ```

### Step 4: Verify

- Check voucher PDFs show correct domain
- Check payment redirects work
- Check email links work
- Check all API calls work

---

## Benefits of This Approach

✅ **Single Source of Truth**: All URLs defined in one place per environment
✅ **Easy Migration**: Change 2 env files instead of 15 code files
✅ **Environment-Specific**: Different URLs for dev/staging/production
✅ **Type Safety**: Helper functions prevent typos and ensure consistency
✅ **Maintainable**: Future URL changes are trivial
✅ **No Code Changes Needed**: Migration is just environment variable updates

---

## Effort Estimate

| Task | Time | Complexity |
|------|------|------------|
| Create config files (2 files) | 15 min | Low |
| Update frontend files (5 files) | 30 min | Low |
| Update backend files (4 files) | 45 min | Medium |
| Test locally | 30 min | Low |
| Build and deploy | 15 min | Low |
| **Total** | **~2 hours** | **Low-Medium** |

---

## Risk Assessment

**Risk Level**: LOW

**Risks**:
- Minor: Typos in new config files
- Minor: Forgetting to import config in some files
- Minor: Environment variables not set on server

**Mitigation**:
- Test thoroughly on localhost first
- Use search to verify all hardcoded URLs are replaced
- Document deployment steps clearly
- Keep old code commented out initially

---

## Testing Checklist

Before deployment, verify:

- [ ] Voucher registration URLs correct in browser-printed vouchers
- [ ] Voucher registration URLs correct in PDF downloads
- [ ] Payment success redirects work
- [ ] Payment failure redirects work
- [ ] Email links in notifications work
- [ ] API calls from frontend work
- [ ] All environment variables set correctly

---

## Alternative Approaches Considered

### Option 1: Global Constants (❌ Not Recommended)
Create constants.js with hardcoded values - still requires code changes for migration.

### Option 2: Database Configuration (❌ Overkill)
Store URLs in database - too complex for simple domain changes.

### Option 3: Build-time Constants (❌ Less Flexible)
Embed URLs during build - requires rebuild to change URLs.

**Chosen: Environment Variables** ✅
- Industry standard
- No rebuild needed for migration
- Works with Docker, PM2, and all deployment platforms
- Separates config from code

---

## Next Steps

1. Create the two config files (`src/config/urls.js` and `backend/config/urls.js`)
2. Update all 15 source code files to use the config
3. Test locally with current domain
4. Deploy to staging/production
5. Document migration procedure for IT team

---

**Status**: Ready to implement
**Priority**: P1 - Should complete before domain migration
**Owner**: Development team
**Estimated Completion**: 1 day

