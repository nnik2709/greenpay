# API Response Standardization Proposal

**Date:** 2026-01-25
**Status:** Draft for Review
**Author:** Claude Code
**Purpose:** Fix API response structure inconsistencies across GreenPay backend

---

## Executive Summary

The GreenPay API currently has inconsistent response structures across different endpoints, leading to:
- Frontend bugs (e.g., "Cannot read properties of undefined")
- Developer confusion when consuming APIs
- Increased maintenance burden
- Difficulty in debugging

**Root Cause:** Different endpoints were written at different times without a standardized API contract.

**Proposal:** Standardize all successful API responses to use a consistent `data` wrapper format.

---

## Current State Analysis

### Pattern 1: Data Wrapped in `data` Object ✅ (Recommended)

**Endpoints using this pattern:**
- `GET /api/quotations` (quotations.js:51)
- `GET /api/quotations/:id` (quotations.js:80)
- `POST /api/individual-purchases/batch` (individual-purchases.js:397-409)

**Example:**
```javascript
res.status(200).json({
  type: 'success',
  status: 'success',
  message: 'Successfully created 3 vouchers',
  data: {
    batchId: 'BATCH-1234567890',
    quantity: 3,
    vouchers: [...],
    passports: [...]
  }
});
```

**Frontend consumption:**
```javascript
const response = await api.post('/individual-purchases/batch', payload);
const { batchId, vouchers } = response.data;  // Access via .data
```

---

### Pattern 2: Data at Root Level ⚠️ (Inconsistent)

**Endpoints using this pattern:**
- `POST /api/individual-purchases/batch-simple` (individual-purchases.js:1026-1033)
- Many older endpoints

**Example:**
```javascript
res.status(201).json({
  type: 'success',
  status: 'success',
  success: true,
  message: '3 voucher(s) created successfully',
  batchId: 'BATCH-1234567890',  // At root level
  vouchers: [...]                // At root level
});
```

**Frontend consumption:**
```javascript
const response = await api.post('/individual-purchases/batch-simple', payload);
const { batchId, vouchers } = response;  // Access at root level
```

---

### Pattern 3: Mixed Error Responses 🔴 (Problematic)

**Inconsistent error structures:**
```javascript
// Some endpoints
res.status(400).json({ error: 'Missing field' });

// Other endpoints
res.status(400).json({
  type: 'error',
  status: 'error',
  message: 'Missing field'
});
```

---

## Problems Caused by Inconsistency

### Real Bug Example (January 2026)

**Symptom:** Creating 3 individual vouchers threw error:
```
Cannot read properties of undefined (reading 'batchId')
```

**Root Cause:**
1. Frontend was calling `/batch-simple` endpoint
2. Developer (Claude) incorrectly assumed it followed `/batch` pattern
3. Changed code to access `response.data.batchId`
4. But `/batch-simple` returns data at ROOT level
5. `response.data` was undefined → crash

**Resolution:**
- Reverted to `response.batchId` (root level access)
- Documented the inconsistency
- Proposed this standardization

---

## Proposed Standard

### Success Response Format

**All successful responses MUST use this structure:**

```javascript
{
  "type": "success",
  "status": "success",
  "message": "Human-readable success message",
  "data": {
    // All response payload here
  }
}
```

**Examples:**

```javascript
// GET /api/quotations
{
  "type": "success",
  "status": "success",
  "message": "Quotations retrieved successfully",
  "data": [
    { id: 1, quotation_number: "Q-001", ... },
    { id: 2, quotation_number: "Q-002", ... }
  ]
}

// POST /api/individual-purchases/batch-simple
{
  "type": "success",
  "status": "success",
  "message": "3 voucher(s) created successfully",
  "data": {
    "batchId": "BATCH-1234567890",
    "vouchers": [...]
  }
}
```

---

### Error Response Format

**All error responses MUST use this structure:**

```javascript
{
  "type": "error",
  "status": "error",
  "message": "Human-readable error message",
  "error": {
    "code": "ERROR_CODE",  // Optional: machine-readable code
    "details": {}          // Optional: additional error context
  }
}
```

**Examples:**

```javascript
// Validation error
{
  "type": "error",
  "status": "error",
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "quantity",
      "reason": "must be between 1 and 5"
    }
  }
}

// Not found
{
  "type": "error",
  "status": "error",
  "message": "Quotation not found",
  "error": {
    "code": "NOT_FOUND",
    "details": {
      "resource": "quotation",
      "id": "123"
    }
  }
}
```

---

## Migration Plan

### Phase 1: Backend Standardization (Breaking Changes)

**Affected Endpoints (Priority):**
1. `POST /api/individual-purchases/batch-simple` - Fix data wrapper
2. All voucher endpoints - Standardize responses
3. All quotation/invoice endpoints - Already mostly compliant
4. Authentication endpoints - Standardize user data

**Implementation Strategy:**

```javascript
// BEFORE (individual-purchases.js:1026-1033)
res.status(201).json({
  type: 'success',
  status: 'success',
  success: true,
  message: `${quantity} voucher(s) created successfully`,
  batchId,      // ❌ Root level
  vouchers      // ❌ Root level
});

// AFTER (standardized)
res.status(201).json({
  type: 'success',
  status: 'success',
  message: `${quantity} voucher(s) created successfully`,
  data: {       // ✅ Wrapped in data
    batchId,
    vouchers
  }
});
```

---

### Phase 2: Frontend Updates (Match New Standard)

**Files to update:**
- `src/pages/IndividualPurchase.jsx` - Change to `response.data.batchId`
- `src/lib/api/client.js` - Update response interceptor
- All other API consumers

**Example fix:**

```javascript
// BEFORE
const response = await api.post('/individual-purchases/batch-simple', payload);
setBatchId(response.batchId);        // ❌ Root level access
setVouchers(response.vouchers);

// AFTER
const response = await api.post('/individual-purchases/batch-simple', payload);
setBatchId(response.data.batchId);   // ✅ Consistent access
setVouchers(response.data.vouchers);
```

---

### Phase 3: API Client Abstraction (Recommended)

Create a standardized API client that automatically handles response extraction:

```javascript
// src/lib/api/standardClient.js
export const apiClient = {
  async get(url) {
    const response = await api.get(url);
    return response.data;  // Auto-extract data
  },

  async post(url, payload) {
    const response = await api.post(url, payload);
    return response.data;  // Auto-extract data
  },

  // ... other methods
};

// Usage in components
const { batchId, vouchers } = await apiClient.post('/individual-purchases/batch-simple', payload);
// No need to access .data - abstracted away
```

---

## Backward Compatibility Strategy

### Option A: Versioned API (Recommended for Production)

```javascript
// Keep old endpoints for backward compatibility
POST /api/v1/individual-purchases/batch-simple  // Old format (deprecated)
POST /api/v2/individual-purchases/batch-simple  // New standardized format

// Redirect after 3 months deprecation period
```

### Option B: Big Bang Migration (Acceptable for Internal App)

Since GreenPay is an internal government application (not public API):
1. Update all backend endpoints in one PR
2. Update all frontend consumers in same PR
3. Test thoroughly with Playwright E2E tests
4. Deploy backend and frontend together

**Recommended:** Option B (Big Bang) for GreenPay's use case.

---

## Implementation Checklist

### Backend Tasks
- [ ] Create response utility functions (standardized wrappers)
- [ ] Update `POST /api/individual-purchases/batch-simple`
- [ ] Update `POST /api/individual-purchases/batch`
- [ ] Update all voucher endpoints
- [ ] Update all quotation endpoints
- [ ] Update all invoice endpoints
- [ ] Update authentication endpoints
- [ ] Add JSDoc comments documenting response format
- [ ] Update API documentation

### Frontend Tasks
- [ ] Update `src/lib/api/client.js` response interceptor
- [ ] Update `src/pages/IndividualPurchase.jsx`
- [ ] Update `src/pages/Quotations.jsx`
- [ ] Update `src/pages/Invoices.jsx`
- [ ] Update `src/pages/CorporateExitPass.jsx`
- [ ] Search for all `api.post`, `api.get` calls and verify response access
- [ ] Create standardized API client wrapper (optional but recommended)

### Testing Tasks
- [ ] Write Playwright E2E test for individual purchase flow
- [ ] Test quotation creation and retrieval
- [ ] Test invoice generation
- [ ] Test corporate voucher creation
- [ ] Test error handling for all endpoints
- [ ] Verify all API calls work with new format

---

## Utility Functions (Recommended)

Create standard response helpers:

```javascript
// backend/utils/apiResponse.js

/**
 * Standard success response wrapper
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {any} data - Response payload
 */
const success = (res, statusCode, message, data) => {
  return res.status(statusCode).json({
    type: 'success',
    status: 'success',
    message,
    data
  });
};

/**
 * Standard error response wrapper
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {object} errorDetails - Optional error details
 */
const error = (res, statusCode, message, errorDetails = null) => {
  const response = {
    type: 'error',
    status: 'error',
    message
  };

  if (errorDetails) {
    response.error = errorDetails;
  }

  return res.status(statusCode).json(response);
};

module.exports = { success, error };
```

**Usage:**

```javascript
const { success, error } = require('../utils/apiResponse');

// Success response
return success(res, 201, '3 voucher(s) created successfully', {
  batchId,
  vouchers
});

// Error response
return error(res, 400, 'Validation failed', {
  code: 'VALIDATION_ERROR',
  details: { field: 'quantity', reason: 'must be between 1 and 5' }
});
```

---

## Benefits of Standardization

1. **Consistency:** All endpoints behave the same way
2. **Developer Experience:** No confusion about response structure
3. **Type Safety:** Can create TypeScript interfaces for responses
4. **Error Reduction:** Prevents "Cannot read property of undefined" bugs
5. **Maintainability:** Easier to update response format in future
6. **Documentation:** Auto-generate API docs from standard format
7. **Testing:** Easier to write tests with predictable responses

---

## Estimated Effort

- **Backend changes:** 4-6 hours
- **Frontend changes:** 3-4 hours
- **Testing:** 2-3 hours
- **Documentation:** 1-2 hours

**Total:** ~10-15 hours of development work

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing frontend code | High | Thorough testing, deploy backend + frontend together |
| Missing API calls during migration | Medium | Use IDE search for all `api.post`, `api.get` calls |
| Regression bugs | Medium | Write comprehensive E2E tests before migration |
| User downtime during deployment | Low | Deploy during low-traffic hours, use PM2 reload |

---

## Decision Required

**Question for Product Owner / Tech Lead:**

1. **Approve this standardization approach?** (Yes/No)
2. **Preferred migration strategy?** (Big Bang vs Versioned API)
3. **Timeline?** (Immediate vs Schedule for future sprint)
4. **Testing requirements?** (Manual QA vs Automated E2E tests)

---

## Next Steps

Once approved:

1. Create feature branch: `feature/api-standardization`
2. Implement backend utility functions
3. Update all backend endpoints
4. Update frontend API client
5. Update all frontend consumers
6. Write E2E tests
7. Test on staging environment
8. Deploy to production
9. Monitor for errors
10. Update documentation

---

## References

- Current bug report: Individual purchase error (Jan 25, 2026)
- Conversation: API inconsistency discussion
- Related docs: `SIMPLIFIED_INDIVIDUAL_PURCHASE_PLAN.md`
- Backend files: `backend/routes/individual-purchases.js`
- Frontend files: `src/pages/IndividualPurchase.jsx`

---

**End of Proposal**
