# API Standardization - Code Patches

This document contains the exact code changes needed to implement API standardization across GreenPay backend.

---

## 1. Individual Purchases - `/batch-simple` Endpoint

**File:** `backend/routes/individual-purchases.js`

### Current Code (Lines 1026-1033)

```javascript
res.status(201).json({
  type: 'success',
  status: 'success',
  success: true,
  message: `${quantity} voucher(s) created successfully`,
  batchId,
  vouchers
});
```

### Standardized Code

```javascript
const { success } = require('../utils/apiResponse');

// ... in route handler ...

return success(res, 201, `${quantity} voucher(s) created successfully`, {
  batchId,
  vouchers
});
```

---

## 2. Individual Purchases - Error Responses

**File:** `backend/routes/individual-purchases.js`

### Current Error Responses (Multiple Locations)

```javascript
// Line 950-954
return res.status(400).json({
  type: 'error',
  status: 'error',
  message: 'Quantity must be between 1 and 5'
});

// Line 958-962
return res.status(400).json({
  type: 'error',
  status: 'error',
  message: 'Payment method is required'
});

// Line 966-971
return res.status(403).json({
  type: 'error',
  status: 'error',
  message: 'Insufficient permissions'
});
```

### Standardized Code

```javascript
const { success, validationError, forbiddenError, serverError } = require('../utils/apiResponse');

// Validation errors
if (!quantity || quantity < 1 || quantity > 5) {
  return validationError(res, 'Quantity must be between 1 and 5', 'quantity', 'must be between 1 and 5');
}

if (!paymentMethod) {
  return validationError(res, 'Payment method is required', 'paymentMethod', 'field is required');
}

// Authorization errors
if (!['Counter_Agent', 'Finance_Manager', 'Flex_Admin'].includes(req.user.role)) {
  return forbiddenError(res, 'Insufficient permissions. Only Counter_Agent, Finance_Manager, and Flex_Admin can create vouchers.');
}

// Server errors
} catch (error) {
  return serverError(res, error);
}
```

---

## 3. Quotations - GET Endpoints

**File:** `backend/routes/quotations.js`

### Current Code (Line 51)

```javascript
res.json({ data: result.rows });
```

### Standardized Code

```javascript
const { success } = require('../utils/apiResponse');

return success(res, 200, 'Quotations retrieved successfully', result.rows);
```

### Current Code (Line 80)

```javascript
res.json({ data: result.rows[0] });
```

### Standardized Code

```javascript
return success(res, 200, 'Quotation retrieved successfully', result.rows[0]);
```

---

## 4. Quotations - Error Responses

**File:** `backend/routes/quotations.js`

### Current Code (Line 54, 77, 83)

```javascript
// Line 54
res.status(500).json({ error: 'Failed to fetch quotations' });

// Line 77
return res.status(404).json({ error: 'Quotation not found' });

// Line 83
res.status(500).json({ error: 'Failed to fetch quotation' });
```

### Standardized Code

```javascript
const { success, notFoundError, serverError } = require('../utils/apiResponse');

// Line 54
} catch (error) {
  return serverError(res, error);
}

// Line 77
if (result.rows.length === 0) {
  return notFoundError(res, 'Quotation', id);
}

// Line 83
} catch (error) {
  return serverError(res, error);
}
```

---

## 5. Vouchers - Corporate Vouchers List

**File:** `backend/routes/vouchers.js`

### Analysis Needed

The vouchers endpoint likely returns data in various formats. Need to standardize:

```javascript
// Current (example - needs verification)
res.json({ vouchers: result.rows, total, page, limit });

// Standardized
return success(res, 200, 'Corporate vouchers retrieved successfully', {
  vouchers: result.rows,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
});
```

---

## 6. Frontend API Client Update

**File:** `src/lib/api/client.js`

### Add Response Interceptor

```javascript
// Current implementation (simplified)
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor to auto-extract data
api.interceptors.response.use(
  (response) => {
    // For standardized responses, auto-extract data
    if (response.data && response.data.type === 'success' && response.data.data !== undefined) {
      return {
        ...response.data,
        data: response.data.data  // Keep data accessible
      };
    }
    return response.data;
  },
  (error) => {
    // Handle standardized error responses
    if (error.response && error.response.data && error.response.data.type === 'error') {
      throw {
        message: error.response.data.message,
        code: error.response.data.error?.code,
        details: error.response.data.error?.details
      };
    }
    throw error;
  }
);

export default api;
```

---

## 7. Frontend - Individual Purchase Page

**File:** `src/pages/IndividualPurchase.jsx`

### Current Code (Lines 265-275)

```javascript
const response = await api.post('/individual-purchases/batch-simple', {
  quantity,
  paymentMethod,
  collectedAmount,
  customerEmail: customerEmail || null,
  posTransactionRef: (paymentMethod === 'POS' || paymentMethod === 'CARD') ? posTransactionRef : null,
  posApprovalCode: (paymentMethod === 'POS' || paymentMethod === 'CARD') ? posApprovalCode : null
});

// batch-simple endpoint returns data at root level
if (response.status === 'success' || response.type === 'success') {
  setBatchId(response.batchId);        // Root level access
  setVouchers(response.vouchers);      // Root level access
```

### Standardized Code (After API client update)

```javascript
const response = await api.post('/individual-purchases/batch-simple', {
  quantity,
  paymentMethod,
  collectedAmount,
  customerEmail: customerEmail || null,
  posTransactionRef: (paymentMethod === 'POS' || paymentMethod === 'CARD') ? posTransactionRef : null,
  posApprovalCode: (paymentMethod === 'POS' || paymentMethod === 'CARD') ? posApprovalCode : null
});

// After standardization, access via .data
if (response.type === 'success') {
  setBatchId(response.data.batchId);   // ✅ Consistent access
  setVouchers(response.data.vouchers); // ✅ Consistent access
```

**Alternative (with updated interceptor):**

The response interceptor can make `response.data` available at root level while keeping backward compatibility:

```javascript
// With smart interceptor, both work:
setBatchId(response.data.batchId);   // ✅ Recommended
// OR
setBatchId(response.batchId);        // ✅ Also works (backward compat)
```

---

## 8. Complete Migration Example - `/batch-simple` Route

**File:** `backend/routes/individual-purchases.js`

### Full Route Handler (Lines 943-1040)

**BEFORE:**

```javascript
router.post('/batch-simple', auth, async (req, res) => {
  try {
    const { quantity, paymentMethod, collectedAmount, customerEmail } = req.body;
    const agentId = req.user.id;

    // Validation
    if (!quantity || quantity < 1 || quantity > 5) {
      return res.status(400).json({
        type: 'error',
        status: 'error',
        message: 'Quantity must be between 1 and 5'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        type: 'error',
        status: 'error',
        message: 'Payment method is required'
      });
    }

    // Check user role
    if (!['Counter_Agent', 'Finance_Manager', 'Flex_Admin'].includes(req.user.role)) {
      return res.status(403).json({
        type: 'error',
        status: 'error',
        message: 'Insufficient permissions'
      });
    }

    // ... voucher creation logic ...

    res.status(201).json({
      type: 'success',
      status: 'success',
      success: true,
      message: `${quantity} voucher(s) created successfully`,
      batchId,
      vouchers
    });

  } catch (error) {
    console.error('[BATCH_SIMPLE] Error:', error);
    res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Failed to create vouchers',
      error: error.message
    });
  }
});
```

**AFTER:**

```javascript
const { success, validationError, forbiddenError, serverError } = require('../utils/apiResponse');

router.post('/batch-simple', auth, async (req, res) => {
  try {
    const { quantity, paymentMethod, collectedAmount, customerEmail } = req.body;
    const agentId = req.user.id;

    // Validation
    if (!quantity || quantity < 1 || quantity > 5) {
      return validationError(res, 'Quantity must be between 1 and 5', 'quantity', 'must be between 1 and 5');
    }

    if (!paymentMethod) {
      return validationError(res, 'Payment method is required', 'paymentMethod', 'field is required');
    }

    // Check user role
    if (!['Counter_Agent', 'Finance_Manager', 'Flex_Admin'].includes(req.user.role)) {
      return forbiddenError(res, 'Insufficient permissions. Only Counter_Agent, Finance_Manager, and Flex_Admin can create vouchers.');
    }

    // ... voucher creation logic ...

    return success(res, 201, `${quantity} voucher(s) created successfully`, {
      batchId,
      vouchers
    });

  } catch (error) {
    console.error('[BATCH_SIMPLE] Error:', error);
    return serverError(res, error);
  }
});
```

---

## 9. Testing Strategy

### Unit Tests (Example)

```javascript
// backend/tests/apiResponse.test.js
const { success, error, validationError } = require('../utils/apiResponse');

describe('API Response Utilities', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  test('success() wraps data in standard format', () => {
    success(res, 200, 'Test success', { foo: 'bar' });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      type: 'success',
      status: 'success',
      message: 'Test success',
      data: { foo: 'bar' }
    });
  });

  test('validationError() creates proper error structure', () => {
    validationError(res, 'Invalid input', 'quantity', 'must be positive');

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      type: 'error',
      status: 'error',
      message: 'Invalid input',
      error: {
        code: 'VALIDATION_ERROR',
        details: {
          field: 'quantity',
          reason: 'must be positive'
        }
      }
    });
  });
});
```

### E2E Tests (Playwright)

```javascript
// tests/e2e/individual-purchase.spec.js
import { test, expect } from '@playwright/test';

test('Individual purchase creates vouchers with standardized response', async ({ request }) => {
  const response = await request.post('/api/individual-purchases/batch-simple', {
    data: {
      quantity: 3,
      paymentMethod: 'CASH',
      collectedAmount: 150.00
    }
  });

  const json = await response.json();

  // Verify standardized response structure
  expect(json).toHaveProperty('type', 'success');
  expect(json).toHaveProperty('status', 'success');
  expect(json).toHaveProperty('message');
  expect(json).toHaveProperty('data');

  // Verify data payload
  expect(json.data).toHaveProperty('batchId');
  expect(json.data).toHaveProperty('vouchers');
  expect(json.data.vouchers).toHaveLength(3);
});
```

---

## 10. Deployment Checklist

### Pre-Deployment
- [ ] All backend endpoints updated to use `apiResponse` utilities
- [ ] All frontend API calls updated to access `response.data`
- [ ] Unit tests written and passing
- [ ] E2E tests written and passing
- [ ] Manual testing completed on dev environment

### Deployment
- [ ] Create database backup
- [ ] Deploy backend changes first
- [ ] Deploy frontend changes immediately after
- [ ] Restart PM2 processes: `pm2 restart greenpay-api`
- [ ] Clear browser caches / hard refresh

### Post-Deployment
- [ ] Verify individual purchase flow
- [ ] Verify quotation creation
- [ ] Verify invoice generation
- [ ] Monitor PM2 logs for errors: `pm2 logs greenpay-api --lines 100`
- [ ] Check for any console errors in browser DevTools

---

## Summary of Files to Modify

### Backend (New Files)
- `backend/utils/apiResponse.js` ✅ Created

### Backend (Modify)
- `backend/routes/individual-purchases.js` - Update `/batch-simple` and `/batch` endpoints
- `backend/routes/quotations.js` - Update GET and POST endpoints
- `backend/routes/invoices-gst.js` - Update all endpoints
- `backend/routes/vouchers.js` - Update corporate voucher endpoints
- `backend/routes/passports.js` - Update all endpoints
- `backend/routes/auth.js` - Update login/register responses
- All other route files in `backend/routes/`

### Frontend (Modify)
- `src/lib/api/client.js` - Add response interceptor
- `src/pages/IndividualPurchase.jsx` - Update response access
- `src/pages/Quotations.jsx` - Update response access
- `src/pages/Invoices.jsx` - Update response access
- `src/pages/CorporateExitPass.jsx` - Update response access
- All other pages consuming API

### Testing (New Files)
- `backend/tests/apiResponse.test.js` - Unit tests
- `tests/e2e/api-standardization.spec.js` - E2E tests

---

**End of Patches Document**
