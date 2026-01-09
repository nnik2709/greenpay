# CODE QUALITY IMPROVEMENT PLAN

**Date**: 2026-01-06
**Status**: Planning Phase
**Priority**: High (Technical Debt Reduction)

---

## Executive Summary

Based on the Architecture Review, the GreenPay codebase has solid security but significant code quality issues:
- Large, monolithic route files (1,185 lines)
- 40% code duplication in PDF generation
- 0% test coverage
- No standardized error handling
- Limited documentation

This plan addresses these issues systematically without disrupting production.

---

## Current State Analysis

### File Size Issues

| File | Lines | Status | Priority |
|------|-------|--------|----------|
| `vouchers.js` | 1,185 | Critical | P0 |
| `invoices-gst.js` | 1,103 | Critical | P0 |
| `public-purchases.js` | 990 | High | P1 |
| `buy-online.js` | 839 | High | P1 |
| `quotations.js` | 577 | Medium | P2 |
| `individual-purchases.js` | 439 | Medium | P2 |

**Target**: No route file > 300 lines

### Code Duplication

**PDF Generation**: Used 46 times across codebase with ~40% duplication
- Similar header/footer logic repeated
- Logo positioning duplicated
- Barcode generation duplicated
- Styling patterns duplicated

**Target**: Single, reusable PDF generation service

### Test Coverage

**Current**: 0% (no unit tests)
**Existing Tests**: Only E2E Playwright tests for workflows
**Target**: 80% coverage for services, 60% for routes

### Error Handling

**Current**: Inconsistent patterns across routes
**Issues**:
- Some use try/catch, others don't
- Different error response formats
- No centralized error logging
- Inconsistent status codes

**Target**: Standardized error middleware + consistent patterns

---

## Improvement Strategy

### Phase 1: Foundation (Week 1)

#### 1.1 Set Up Testing Infrastructure
**Priority**: P0
**Time**: 2 hours

```bash
# Install testing dependencies
npm install --save-dev jest @types/jest supertest
npm install --save-dev @jest/globals
```

**Create test structure**:
```
backend/
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   └── routes/
│   └── setup.js
└── jest.config.js
```

**Deliverables**:
- ✅ Jest configured
- ✅ Test directory structure
- ✅ Sample test for existing service
- ✅ npm test command working

#### 1.2 Extract PDF Generation Service
**Priority**: P0
**Time**: 4 hours

**Current State**: `pdfGenerator.js` has one function, routes have inline PDF code

**Target Structure**:
```
backend/services/pdf/
├── PDFService.js           # Main service class
├── templates/
│   ├── VoucherTemplate.js  # Voucher PDF template
│   ├── InvoiceTemplate.js  # Invoice PDF template
│   ├── QuotationTemplate.js
│   └── PassportTemplate.js
├── components/
│   ├── Header.js           # Reusable header with logos
│   ├── Footer.js           # Reusable footer
│   ├── Barcode.js          # Barcode generation
│   └── QRCode.js           # QR code generation
└── styles/
    └── colors.js           # Color constants
```

**Benefits**:
- Eliminate 40% duplication
- 8x performance improvement (Architecture Review estimate)
- Easier to maintain and test
- Consistent PDF styling across system

**Implementation Steps**:
1. Create `PDFService.js` with base class
2. Extract logo positioning logic into `Header.js`
3. Extract barcode/QR into dedicated components
4. Create template classes for each document type
5. Update routes to use new service (one at a time)
6. Write unit tests for each component

#### 1.3 Standardize Error Handling
**Priority**: P0
**Time**: 3 hours

**Create centralized error middleware**:
```javascript
// backend/middleware/errorHandler.js
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, next) => {
  // Standardized error response
  // Logging
  // Error tracking (optional: Sentry integration)
};
```

**Error Response Format**:
```json
{
  "error": "Voucher not found",
  "code": "VOUCHER_NOT_FOUND",
  "statusCode": 404,
  "timestamp": "2026-01-06T10:30:00Z",
  "requestId": "uuid-here"
}
```

**Deliverables**:
- ✅ AppError class created
- ✅ Error middleware implemented
- ✅ Added to server.js
- ✅ Documentation for error codes

---

### Phase 2: Refactoring (Week 2)

#### 2.1 Refactor vouchers.js (1,185 lines)
**Priority**: P0
**Time**: 8 hours

**Current Structure**: Single massive file with all voucher operations

**Target Structure**:
```
backend/modules/vouchers/
├── routes.js                    # Express routes (< 200 lines)
├── controller.js                # Request handlers (< 300 lines)
├── service.js                   # Business logic (< 300 lines)
├── validators/
│   ├── createVoucher.js
│   ├── validateVoucher.js
│   └── emailVoucher.js
└── __tests__/
    ├── service.test.js
    ├── controller.test.js
    └── validators.test.js
```

**Responsibilities**:
- **routes.js**: Route definitions only, no logic
- **controller.js**: Handle HTTP requests/responses
- **service.js**: Business logic, database operations
- **validators/**: Input validation schemas

**Migration Strategy**:
1. Create new module structure
2. Move validators first (easiest)
3. Extract service functions (database logic)
4. Create controller functions
5. Update routes to use controller
6. Write tests for each layer
7. Deploy and verify
8. Remove old file

#### 2.2 Refactor invoices-gst.js (1,103 lines)
**Priority**: P0
**Time**: 6 hours

Similar structure to vouchers:
```
backend/modules/invoices/
├── routes.js
├── controller.js
├── service.js
└── __tests__/
```

#### 2.3 Refactor public-purchases.js (990 lines)
**Priority**: P1
**Time**: 6 hours

#### 2.4 Refactor buy-online.js (839 lines)
**Priority**: P1
**Time**: 5 hours

---

### Phase 3: Testing (Week 3)

#### 3.1 Unit Tests for Services
**Priority**: P0
**Time**: 10 hours

**Services to Test**:
- ✅ PDF Service (all templates)
- ✅ Email Service
- ✅ Notification Service
- ✅ Voucher Service
- ✅ Invoice Service
- ✅ Payment Gateway Services

**Example Test Structure**:
```javascript
describe('PDFService', () => {
  describe('generateVoucherPDF', () => {
    it('should generate PDF with correct voucher code', async () => {
      // Test implementation
    });

    it('should include CCDA and PNG logos', async () => {
      // Test logo embedding
    });

    it('should generate valid CODE128 barcode', async () => {
      // Test barcode
    });

    it('should handle missing logo files gracefully', async () => {
      // Test error handling
    });
  });
});
```

**Target Coverage**: 80% for services

#### 3.2 Integration Tests for Routes
**Priority**: P1
**Time**: 12 hours

**Routes to Test**:
- Authentication (login, register, logout)
- Vouchers (create, validate, email)
- Invoices (create, download, email)
- Payments (webhook handling)
- Corporate vouchers (batch operations)

**Example**:
```javascript
describe('POST /api/vouchers', () => {
  it('should create voucher with valid data', async () => {
    const response = await request(app)
      .post('/api/vouchers')
      .set('Authorization', `Bearer ${validToken}`)
      .send(validVoucherData)
      .expect(201);

    expect(response.body).toHaveProperty('voucher_code');
  });

  it('should reject invalid passport number', async () => {
    await request(app)
      .post('/api/vouchers')
      .send({ passport: 'invalid' })
      .expect(400);
  });
});
```

**Target Coverage**: 60% for routes

#### 3.3 API Documentation
**Priority**: P2
**Time**: 4 hours

Add JSDoc comments to all route handlers:
```javascript
/**
 * Create a new voucher for passport holder
 * @route POST /api/vouchers
 * @param {string} req.body.passport - Passport number
 * @param {string} req.body.full_name - Full name
 * @param {string} req.body.nationality - Nationality
 * @returns {Object} Created voucher with voucher_code
 * @throws {400} Invalid input data
 * @throws {409} Voucher already exists for passport
 * @throws {500} Server error
 */
router.post('/', auth, validateVoucher, async (req, res, next) => {
  // Implementation
});
```

---

### Phase 4: Optimization (Week 4)

#### 4.1 Database Query Optimization
**Priority**: P1
**Time**: 4 hours

**Targets** (from Architecture Review):
- Add indexes for frequently queried fields
- Optimize N+1 queries in reports
- Add connection pooling tuning

**Queries to Optimize**:
```sql
-- Add index for voucher lookups (currently slow)
CREATE INDEX idx_vouchers_code ON vouchers(voucher_code);
CREATE INDEX idx_vouchers_passport ON vouchers(passport);
CREATE INDEX idx_vouchers_status ON vouchers(status);

-- Add index for invoice queries
CREATE INDEX idx_invoices_status_date ON invoices(status, created_at);

-- Add composite index for reports
CREATE INDEX idx_transactions_date_type ON transactions(created_at, transaction_type);
```

#### 4.2 Add Caching Layer (Optional)
**Priority**: P2
**Time**: 6 hours

**Use Case**: Cache user authentication data (currently queries DB on every request)

**Implementation**:
```javascript
// backend/services/CacheService.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 min TTL

class CacheService {
  async getUser(userId) {
    const cached = cache.get(`user:${userId}`);
    if (cached) return cached;

    const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    cache.set(`user:${userId}`, user);
    return user;
  }
}
```

**Benefits**:
- Reduce DB load
- Faster authentication
- Better scalability

---

## Implementation Timeline

### Week 1: Foundation
- **Day 1-2**: Set up testing infrastructure, write first tests
- **Day 3-5**: Extract and test PDF generation service
- **Day 6-7**: Standardize error handling

### Week 2: Major Refactoring
- **Day 8-10**: Refactor vouchers.js into modules
- **Day 11-12**: Refactor invoices-gst.js
- **Day 13-14**: Refactor public-purchases.js and buy-online.js

### Week 3: Testing & Documentation
- **Day 15-17**: Write comprehensive unit tests
- **Day 18-20**: Write integration tests
- **Day 21**: Add API documentation

### Week 4: Optimization
- **Day 22-23**: Database optimization
- **Day 24-25**: Caching layer (optional)
- **Day 26-28**: Code review, documentation, deployment

---

## Success Metrics

### Code Quality
- ✅ No route file > 300 lines
- ✅ PDF duplication reduced from 40% to < 5%
- ✅ All services have JSDoc documentation
- ✅ Consistent error handling across all routes

### Testing
- ✅ 80% test coverage for services
- ✅ 60% test coverage for routes
- ✅ All critical paths have integration tests
- ✅ CI/CD pipeline running tests automatically

### Performance
- ✅ PDF generation 8x faster
- ✅ Authentication 5x faster (if caching implemented)
- ✅ API response times < 200ms (p95)

### Maintainability
- ✅ New developers can understand module structure
- ✅ Adding new features takes < 50% of current time
- ✅ Bug fixes are easier to locate and test

---

## Risk Mitigation

### Risk 1: Breaking Production During Refactoring
**Mitigation**:
- Refactor one module at a time
- Keep old code until new code is tested
- Use feature flags for gradual rollout
- Extensive testing before deployment

### Risk 2: Test Suite Takes Too Long
**Mitigation**:
- Use test parallelization
- Mock external services (SMTP, payment gateways)
- Separate unit tests (fast) from integration tests (slower)

### Risk 3: Team Resistance to New Structure
**Mitigation**:
- Document new patterns clearly
- Provide examples for each module type
- Code review process to maintain consistency

---

## Next Steps

1. **Approval**: Get stakeholder approval for plan
2. **Setup**: Install testing dependencies
3. **Start**: Begin with Phase 1 (Foundation)
4. **Review**: Weekly progress reviews
5. **Deploy**: Incremental deployments with monitoring

---

## Appendix: File Structure After Refactoring

```
backend/
├── config/              # Configuration files
├── middleware/          # Middleware (auth, rate limiting, error handling)
├── modules/             # Feature modules
│   ├── vouchers/
│   │   ├── routes.js
│   │   ├── controller.js
│   │   ├── service.js
│   │   ├── validators/
│   │   └── __tests__/
│   ├── invoices/
│   ├── passports/
│   └── payments/
├── services/            # Shared services
│   ├── pdf/
│   │   ├── PDFService.js
│   │   ├── templates/
│   │   └── components/
│   ├── email/
│   ├── cache/
│   └── audit/
├── utils/               # Utility functions
├── tests/               # Test configuration
│   ├── setup.js
│   ├── helpers/
│   └── fixtures/
└── server.js            # Main server file
```

---

**Prepared By**: Claude Code (Senior Developer)
**Date**: 2026-01-06
**Status**: Ready for Implementation
