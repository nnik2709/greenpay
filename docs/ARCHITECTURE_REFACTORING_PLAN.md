# GreenPay Voucher System - Architecture Refactoring Plan

## Executive Summary

This document outlines a comprehensive plan to refactor the GreenPay voucher system from its current monolithic architecture into a clean, modular, service-oriented design. The refactoring addresses critical issues including massive code duplication (~500 lines), inconsistent data access patterns, and unmaintainable route files.

**Current State:**
- 5 route files totaling 4,855 lines
- ~500 lines of duplicated code
- Business logic scattered across routes
- 3 separate database tables for vouchers
- No service layer abstraction

**Target State:**
- Clean service layer with single responsibility
- DRY (Don't Repeat Yourself) principle applied
- Testable, maintainable code
- Centralized business logic
- Consistent data access patterns

---

## Phase 1: Service Layer Extraction (Week 1)

### 1.1 Create VoucherService

**File:** `/backend/services/vouchers/voucherService.js`

**Purpose:** Centralize all voucher business logic and data access

**API:**
```javascript
class VoucherService {
  // Multi-table voucher lookup with normalization
  async findByCode(voucherCode)

  // Validate voucher and return detailed status
  async validateVoucher(voucherCode)

  // Mark voucher as used/redeemed
  async markAsUsed(voucherCode, userId)

  // Compute voucher status (business logic)
  computeStatus(voucher)

  // Batch operations
  async getVouchersByBatch(batchId)

  // Creation methods
  async createIndividualVoucher(data)
  async createCorporateVoucher(data)
  async createBulkVouchers(vouchers, batchId)

  // Passport registration
  async registerPassport(voucherCode, passportData, userId)

  // Check if passport already registered
  isPassportRegistered(voucher)
}
```

**Implementation Priority:** **CRITICAL** - Eliminates ~60 lines of duplication

---

### 1.2 Create PDF Service

**File:** `/backend/services/pdf/pdfService.js`

**Purpose:** Centralize all PDF generation logic

**API:**
```javascript
class PDFService {
  // Generate single voucher PDF buffer
  async generateVoucherPDF(voucher, options = {})

  // Generate multiple voucher PDFs (batch)
  async generateBatchVoucherPDFs(vouchers, options = {})

  // Generate email-ready PDF attachments
  async generatePDFAttachments(vouchers, batchName = '')

  // Specialized PDF generators
  async generateInvoicePDF(invoice)
  async generateQuotationPDF(quotation)
  async generateReceiptPDF(transaction)
}
```

**Helper:** `/backend/services/pdf/pdfAttachmentHelper.js`
```javascript
// Extract the common PDF attachment loop pattern
async function createPDFAttachments(vouchers, titlePrefix) {
  const attachments = [];
  for (const voucher of vouchers) {
    const pdfBuffer = await generateVoucherPDF(voucher, { title: titlePrefix });
    attachments.push({
      filename: `voucher-${voucher.voucher_code}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    });
  }
  return attachments;
}
```

**Implementation Priority:** **CRITICAL** - Eliminates ~50 lines of duplication

---

### 1.3 Create Email Service

**File:** `/backend/services/email/emailService.js`

**Purpose:** Centralize all email sending logic

**API:**
```javascript
class EmailService {
  // Initialize SMTP transporter (singleton pattern)
  getTransporter()

  // High-level email operations
  async sendVoucherEmail(recipients, vouchers, options = {})
  async sendInvoiceEmail(recipient, invoice, pdfBuffer)
  async sendQuotationEmail(recipient, quotation, pdfBuffer)
  async sendGenericEmail(recipient, subject, htmlContent, attachments = [])

  // Template rendering
  renderVoucherEmailTemplate(vouchers, options = {})
  renderInvoiceEmailTemplate(invoice)
  renderQuotationEmailTemplate(quotation)
}
```

**Template:** `/backend/services/email/templates/voucherEmailTemplate.js`
```javascript
module.exports = function renderVoucherEmailTemplate(vouchers, options) {
  const { companyName, batchId, customMessage } = options;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        /* Centralized email styles */
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #059669 0%, #14b8a6 100%); }
        /* ... */
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>PNG Green Fees System</h1>
          <p>Climate Change and Development Authority</p>
        </div>
        <div class="content">
          <h2>Your Green Fee Vouchers</h2>
          ${customMessage || ''}
          <!-- Voucher details -->
        </div>
      </div>
    </body>
    </html>
  `;
};
```

**Implementation Priority:** **HIGH** - Eliminates ~200 lines of duplication

---

## Phase 2: Route Refactoring (Week 2)

### 2.1 Refactor Corporate Voucher Routes

**Before** (`/backend/routes/vouchers.js` - 1,260 lines):
```javascript
// Monolithic route with embedded business logic
router.post('/email-vouchers', auth, async (req, res) => {
  try {
    // 1. Direct database query
    const result = await db.query(`SELECT * FROM corporate_vouchers WHERE ...`);

    // 2. PDF generation logic embedded
    for (const voucher of vouchers) {
      const pdfBuffer = await generateVouchersPDF([voucher], companyName);
      pdfAttachments.push({ filename: `voucher-${voucher.voucher_code}.pdf`, ... });
    }

    // 3. Email transporter creation
    const transporter = nodemailer.createTransporter({ ... });

    // 4. HTML template embedded
    const htmlContent = `<!DOCTYPE html>...`;

    // 5. Email sending
    await transporter.sendMail({ ... });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to email vouchers' });
  }
});
```

**After** (`/backend/routes/vouchers/corporateVouchers.js` - ~300 lines):
```javascript
const VoucherService = require('../../services/vouchers/voucherService');
const EmailService = require('../../services/email/emailService');

const voucherService = new VoucherService();
const emailService = new EmailService();

// Clean, focused route
router.post('/email', auth, checkRole('Flex_Admin', 'Finance_Manager'), async (req, res) => {
  try {
    const { companyName, recipientEmail } = req.body;

    // 1. Service layer handles data retrieval
    const vouchers = await voucherService.getVouchersByCompany(companyName);

    // 2. Service layer handles email sending (includes PDF generation)
    await emailService.sendVoucherEmail(
      recipientEmail,
      vouchers,
      { companyName, batchType: 'Corporate' }
    );

    res.json({ success: true, message: 'Vouchers emailed successfully' });
  } catch (error) {
    console.error('Email vouchers error:', error);
    res.status(500).json({ error: 'Failed to email vouchers' });
  }
});
```

**Benefits:**
- Route reduced from ~150 lines to ~20 lines
- Business logic moved to services
- Testable in isolation
- Reusable across endpoints

---

### 2.2 Split Routes by Voucher Type

**New Structure:**
```
backend/routes/vouchers/
├── corporateVouchers.js       # Corporate voucher CRUD
├── individualVouchers.js      # Individual voucher CRUD
├── voucherValidation.js       # Validation & redemption
├── voucherRegistration.js     # Passport registration
├── voucherRetrieval.js        # Lost voucher recovery
└── index.js                   # Route aggregator
```

**Route Aggregator** (`/backend/routes/vouchers/index.js`):
```javascript
const express = require('express');
const router = express.Router();

// Import sub-routers
const corporateVouchers = require('./corporateVouchers');
const individualVouchers = require('./individualVouchers');
const voucherValidation = require('./voucherValidation');
const voucherRegistration = require('./voucherRegistration');
const voucherRetrieval = require('./voucherRetrieval');

// Mount sub-routers
router.use('/corporate', corporateVouchers);
router.use('/individual', individualVouchers);
router.use('/validate', voucherValidation);
router.use('/registration', voucherRegistration);
router.use('/retrieval', voucherRetrieval);

module.exports = router;
```

**Server Update** (`/backend/server.js`):
```javascript
// OLD:
const voucherRoutes = require('./routes/vouchers');
const corporateVoucherRegistrationRoutes = require('./routes/corporate-voucher-registration');
const individualPurchasesRoutes = require('./routes/individual-purchases');

app.use('/api/vouchers', voucherRoutes);
app.use('/api/corporate-voucher-registration', corporateVoucherRegistrationRoutes);
app.use('/api/individual-purchases', individualPurchasesRoutes);

// NEW:
const voucherRoutes = require('./routes/vouchers'); // Now includes all sub-routes

app.use('/api/vouchers', voucherRoutes);
```

**API Path Changes:**
```
OLD: POST /api/vouchers/email-vouchers
NEW: POST /api/vouchers/corporate/email

OLD: POST /api/corporate-voucher-registration/register
NEW: POST /api/vouchers/registration/register

OLD: GET /api/individual-purchases/batch/:batchId
NEW: GET /api/vouchers/individual/batch/:batchId
```

**Migration Strategy:**
- Keep old routes active with deprecation warnings
- Add forwarding routes for backward compatibility
- Update frontend to use new API paths gradually
- Remove old routes after 2-week transition period

---

## Phase 3: Database Abstraction (Week 3)

### 3.1 Create Repository Layer

**File:** `/backend/repositories/voucherRepository.js`

**Purpose:** Abstract database access for vouchers

**API:**
```javascript
class VoucherRepository {
  // Multi-table queries
  async findByCode(voucherCode)
  async findByBatch(batchId)
  async findByCompany(companyName, options = {})

  // CRUD operations
  async create(voucherData, type = 'individual')
  async update(voucherCode, updateData)
  async delete(voucherCode)

  // Batch operations
  async createBatch(vouchers, batchId, type = 'individual')
  async updateBatch(voucherCodes, updateData)

  // Status operations
  async markAsUsed(voucherCode, userId)
  async markAsExpired(voucherCode)

  // Reporting queries
  async getStatsByDateRange(startDate, endDate)
  async getRevenueByVoucherType(startDate, endDate)
}
```

**Implementation:**
```javascript
class VoucherRepository {
  constructor(db) {
    this.db = db;
  }

  async findByCode(voucherCode) {
    const trimmedCode = voucherCode.trim().toUpperCase();

    // Try individual_purchases first (most common)
    const individualResult = await this.db.query(
      `SELECT
        id, voucher_code, passport_number, customer_name as full_name,
        customer_email, customer_phone, amount, valid_from, valid_until,
        used_at, status, batch_id, created_at, 'individual' as voucher_type
       FROM individual_purchases
       WHERE voucher_code = $1`,
      [trimmedCode]
    );

    if (individualResult.rows.length > 0) {
      return this._normalizeVoucher(individualResult.rows[0]);
    }

    // Try corporate_vouchers
    const corporateResult = await this.db.query(
      `SELECT
        cv.id, cv.voucher_code, cv.passport_number, cv.company_name,
        cv.amount, cv.valid_from, cv.valid_until, cv.redeemed_date as used_at,
        cv.status, cv.batch_id, cv.created_at, 'corporate' as voucher_type,
        p.full_name, p.nationality, p.date_of_birth
       FROM corporate_vouchers cv
       LEFT JOIN passports p ON cv.passport_id = p.id
       WHERE cv.voucher_code = $1`,
      [trimmedCode]
    );

    if (corporateResult.rows.length > 0) {
      return this._normalizeVoucher(corporateResult.rows[0]);
    }

    // Try legacy vouchers table
    const legacyResult = await this.db.query(
      `SELECT
        id, voucher_code, issued_to as passport_number, amount,
        valid_from, valid_until, issued_date as created_at,
        status, 'legacy' as voucher_type
       FROM vouchers
       WHERE voucher_code = $1`,
      [trimmedCode]
    );

    if (legacyResult.rows.length > 0) {
      return this._normalizeVoucher(legacyResult.rows[0]);
    }

    return null;
  }

  // Normalize voucher data from different tables into consistent format
  _normalizeVoucher(voucher) {
    return {
      id: voucher.id,
      voucherCode: voucher.voucher_code,
      passportNumber: voucher.passport_number,
      fullName: voucher.full_name || voucher.company_name,
      email: voucher.customer_email || null,
      phone: voucher.customer_phone || null,
      amount: parseFloat(voucher.amount),
      validFrom: voucher.valid_from,
      validUntil: voucher.valid_until,
      usedAt: voucher.used_at || voucher.redeemed_date,
      status: voucher.status,
      batchId: voucher.batch_id,
      createdAt: voucher.created_at || voucher.issued_date,
      voucherType: voucher.voucher_type,
      // Passport details (if joined)
      nationality: voucher.nationality || null,
      dateOfBirth: voucher.date_of_birth || null
    };
  }
}

module.exports = VoucherRepository;
```

---

### 3.2 Create Passport Repository

**File:** `/backend/repositories/passportRepository.js`

**API:**
```javascript
class PassportRepository {
  async findByNumber(passportNumber)
  async create(passportData)
  async update(passportNumber, updateData)
  async linkToVoucher(passportNumber, voucherCode)
  async getVouchersByPassport(passportNumber)
}
```

---

## Phase 4: Service Implementation Details

### 4.1 VoucherService Implementation

**File:** `/backend/services/vouchers/voucherService.js`

```javascript
const VoucherRepository = require('../../repositories/voucherRepository');
const PassportRepository = require('../../repositories/passportRepository');
const { generateVoucherCode } = require('../../config/voucherConfig').helpers;

class VoucherService {
  constructor(db) {
    this.voucherRepo = new VoucherRepository(db);
    this.passportRepo = new PassportRepository(db);
  }

  /**
   * Find voucher by code across all tables
   * @param {string} voucherCode - Voucher code to search for
   * @returns {Object|null} Normalized voucher object or null
   */
  async findByCode(voucherCode) {
    if (!voucherCode || typeof voucherCode !== 'string') {
      throw new Error('Invalid voucher code');
    }

    return await this.voucherRepo.findByCode(voucherCode);
  }

  /**
   * Validate voucher and return detailed status
   * @param {string} voucherCode - Voucher code to validate
   * @returns {Object} Validation result with status and message
   */
  async validateVoucher(voucherCode) {
    const voucher = await this.findByCode(voucherCode);

    if (!voucher) {
      return {
        valid: false,
        status: 'not_found',
        message: 'INVALID - Voucher not found'
      };
    }

    // Compute current status
    const currentStatus = this.computeStatus(voucher);

    // Check various invalid states
    if (currentStatus === 'used') {
      return {
        valid: false,
        status: 'used',
        message: `INVALID - Already used on ${this._formatDate(voucher.usedAt)}`,
        voucher
      };
    }

    if (currentStatus === 'expired') {
      return {
        valid: false,
        status: 'expired',
        message: `INVALID - Expired on ${this._formatDate(voucher.validUntil)}`,
        voucher
      };
    }

    if (currentStatus === 'pending_passport') {
      return {
        valid: false,
        status: 'pending_passport',
        message: 'INVALID - Passport registration required',
        voucher,
        registrationUrl: `/voucher-registration?code=${voucherCode}`
      };
    }

    if (currentStatus !== 'active') {
      return {
        valid: false,
        status: currentStatus,
        message: `INVALID - Status: ${currentStatus}`,
        voucher
      };
    }

    // Voucher is valid
    return {
      valid: true,
      status: 'active',
      message: '✅ VALID - Entry approved',
      voucher
    };
  }

  /**
   * Compute voucher status based on business rules
   * CENTRALIZED STATUS LOGIC - Single source of truth
   * @param {Object} voucher - Normalized voucher object
   * @returns {string} Status: 'active', 'used', 'expired', 'pending_passport'
   */
  computeStatus(voucher) {
    // Check if already used/redeemed
    if (voucher.usedAt) {
      return 'used';
    }

    // Check if expired
    if (new Date(voucher.validUntil) < new Date()) {
      return 'expired';
    }

    // Check if passport registration pending
    if (!this.isPassportRegistered(voucher)) {
      return 'pending_passport';
    }

    // Voucher is active
    return 'active';
  }

  /**
   * Check if passport is registered to voucher
   * @param {Object} voucher - Voucher object
   * @returns {boolean} True if passport is registered
   */
  isPassportRegistered(voucher) {
    const passportNumber = voucher.passportNumber;

    // Check if passport number exists and is valid
    return passportNumber &&
           passportNumber !== null &&
           passportNumber !== 'PENDING' &&
           passportNumber !== 'pending' &&
           passportNumber !== '' &&
           String(passportNumber).trim() !== '';
  }

  /**
   * Mark voucher as used/redeemed
   * @param {string} voucherCode - Voucher code
   * @param {number} userId - User ID who redeemed the voucher
   * @returns {Object} Updated voucher
   */
  async markAsUsed(voucherCode, userId = null) {
    const voucher = await this.findByCode(voucherCode);

    if (!voucher) {
      throw new Error('Voucher not found');
    }

    if (voucher.usedAt) {
      throw new Error('Voucher already used');
    }

    await this.voucherRepo.markAsUsed(voucherCode, userId);

    return await this.findByCode(voucherCode);
  }

  /**
   * Register passport to voucher
   * @param {string} voucherCode - Voucher code
   * @param {Object} passportData - Passport information
   * @param {number} userId - User ID performing registration
   * @returns {Object} Updated voucher with passport
   */
  async registerPassport(voucherCode, passportData, userId = null) {
    const voucher = await this.findByCode(voucherCode);

    if (!voucher) {
      throw new Error('Voucher not found');
    }

    if (this.isPassportRegistered(voucher)) {
      throw new Error('Voucher already registered to a passport');
    }

    if (new Date(voucher.validUntil) < new Date()) {
      throw new Error('Voucher has expired');
    }

    // Check if passport already exists
    const { passportNumber, surname, givenName, nationality, dateOfBirth, dateOfExpiry } = passportData;

    let passport = await this.passportRepo.findByNumber(passportNumber);

    if (!passport) {
      // Create new passport record
      passport = await this.passportRepo.create({
        passportNumber,
        fullName: `${surname} ${givenName}`.trim(),
        nationality,
        dateOfBirth,
        expiryDate: dateOfExpiry
      });
    }

    // Link passport to voucher
    await this.passportRepo.linkToVoucher(passportNumber, voucherCode, userId);

    return await this.findByCode(voucherCode);
  }

  /**
   * Create individual voucher
   * @param {Object} data - Voucher data
   * @returns {Object} Created voucher
   */
  async createIndividualVoucher(data) {
    const voucherCode = generateVoucherCode('IND');

    const voucherData = {
      voucherCode,
      passportNumber: data.passportNumber || null,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      validFrom: data.validFrom || new Date(),
      validUntil: data.validUntil,
      batchId: data.batchId || null,
      createdBy: data.createdBy
    };

    return await this.voucherRepo.create(voucherData, 'individual');
  }

  /**
   * Create corporate voucher
   * @param {Object} data - Voucher data
   * @returns {Object} Created voucher
   */
  async createCorporateVoucher(data) {
    const voucherCode = generateVoucherCode('CORP');

    const voucherData = {
      voucherCode,
      companyName: data.companyName,
      amount: data.amount,
      validFrom: data.validFrom || new Date(),
      validUntil: data.validUntil,
      batchId: data.batchId || null,
      invoiceId: data.invoiceId || null,
      createdBy: data.createdBy
    };

    return await this.voucherRepo.create(voucherData, 'corporate');
  }

  /**
   * Get vouchers by batch ID
   * @param {string} batchId - Batch identifier
   * @returns {Array} Array of vouchers
   */
  async getVouchersByBatch(batchId) {
    return await this.voucherRepo.findByBatch(batchId);
  }

  // Helper method to format dates
  _formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

module.exports = VoucherService;
```

---

## Phase 5: Migration Strategy

### 5.1 Backward Compatibility

**Approach:** Maintain old routes while adding new service-based routes

**Implementation:**
```javascript
// backend/routes/vouchers.js (legacy - to be deprecated)
const VoucherService = require('../services/vouchers/voucherService');
const db = require('../config/database');

const voucherService = new VoucherService(db);

// OLD ROUTE - Deprecated but functional
router.post('/email-vouchers', auth, async (req, res) => {
  console.warn('DEPRECATED: /api/vouchers/email-vouchers - Use /api/vouchers/corporate/email instead');

  // Forward to new service-based implementation
  try {
    const { companyName, recipientEmail } = req.body;
    const emailService = require('../services/email/emailService');

    const vouchers = await voucherService.getVouchersByCompany(companyName);
    await emailService.sendVoucherEmail(recipientEmail, vouchers, { companyName });

    res.json({ success: true, message: 'Vouchers emailed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to email vouchers' });
  }
});
```

---

### 5.2 Testing Strategy

**Unit Tests:**
```javascript
// backend/tests/unit/services/voucherService.test.js
const VoucherService = require('../../../services/vouchers/voucherService');
const mockDb = require('../../mocks/database');

describe('VoucherService', () => {
  let voucherService;

  beforeEach(() => {
    voucherService = new VoucherService(mockDb);
  });

  describe('computeStatus', () => {
    it('should return "used" for used vouchers', () => {
      const voucher = {
        usedAt: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        passportNumber: 'ABC123'
      };

      expect(voucherService.computeStatus(voucher)).toBe('used');
    });

    it('should return "expired" for expired vouchers', () => {
      const voucher = {
        usedAt: null,
        validUntil: new Date('2020-01-01'),
        passportNumber: 'ABC123'
      };

      expect(voucherService.computeStatus(voucher)).toBe('expired');
    });

    it('should return "pending_passport" for vouchers without passport', () => {
      const voucher = {
        usedAt: null,
        validUntil: new Date('2025-12-31'),
        passportNumber: null
      };

      expect(voucherService.computeStatus(voucher)).toBe('pending_passport');
    });

    it('should return "active" for valid vouchers', () => {
      const voucher = {
        usedAt: null,
        validUntil: new Date('2025-12-31'),
        passportNumber: 'ABC123'
      };

      expect(voucherService.computeStatus(voucher)).toBe('active');
    });
  });

  describe('isPassportRegistered', () => {
    it('should return false for null passport', () => {
      expect(voucherService.isPassportRegistered({ passportNumber: null })).toBe(false);
    });

    it('should return false for "PENDING" passport', () => {
      expect(voucherService.isPassportRegistered({ passportNumber: 'PENDING' })).toBe(false);
    });

    it('should return true for valid passport', () => {
      expect(voucherService.isPassportRegistered({ passportNumber: 'ABC123' })).toBe(true);
    });
  });
});
```

---

### 5.3 Deployment Checklist

**Pre-Deployment:**
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Service layer code reviewed
- [ ] Documentation updated
- [ ] API documentation generated
- [ ] Backward compatibility verified

**Deployment Steps:**
1. Deploy service layer files (no breaking changes)
2. Deploy updated route files with deprecation warnings
3. Monitor logs for deprecated endpoint usage
4. Update frontend to use new API endpoints
5. Monitor for errors in production
6. After 2 weeks, remove deprecated routes

**Rollback Plan:**
- Keep old route files in `backend/routes/legacy/`
- Can quickly restore by updating `server.js` imports
- Database schema unchanged (no rollback needed)

---

## File Structure (Final)

```
backend/
├── routes/
│   ├── vouchers/
│   │   ├── index.js                    # Route aggregator
│   │   ├── corporateVouchers.js        # ~200 lines
│   │   ├── individualVouchers.js       # ~200 lines
│   │   ├── voucherValidation.js        # ~100 lines
│   │   ├── voucherRegistration.js      # ~150 lines
│   │   └── voucherRetrieval.js         # ~100 lines
│   ├── public-purchases.js             # Unchanged (external API)
│   └── legacy/                         # Deprecated routes (backup)
│       ├── vouchers.js
│       └── individual-purchases.js
├── services/
│   ├── vouchers/
│   │   └── voucherService.js           # ~300 lines
│   ├── pdf/
│   │   ├── pdfService.js               # ~200 lines
│   │   └── pdfAttachmentHelper.js      # ~50 lines
│   ├── email/
│   │   ├── emailService.js             # ~150 lines
│   │   └── templates/
│   │       ├── voucherEmailTemplate.js # ~100 lines
│   │       ├── invoiceEmailTemplate.js # ~100 lines
│   │       └── quotationEmailTemplate.js # ~100 lines
│   └── notificationService.js          # Refactored to use above services
├── repositories/
│   ├── voucherRepository.js            # ~200 lines
│   └── passportRepository.js           # ~100 lines
└── tests/
    ├── unit/
    │   ├── services/
    │   │   ├── voucherService.test.js
    │   │   ├── pdfService.test.js
    │   │   └── emailService.test.js
    │   └── repositories/
    │       ├── voucherRepository.test.js
    │       └── passportRepository.test.js
    └── integration/
        ├── voucherFlow.test.js
        └── emailFlow.test.js
```

**Lines of Code Comparison:**

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Total route files | 4,855 | 1,500 | **-69%** |
| Duplicated code | ~500 | 0 | **-100%** |
| Largest route file | 1,260 | 200 | **-84%** |
| Service layer LOC | 0 | 1,200 | New |
| Repository layer LOC | 0 | 300 | New |
| Test coverage | 0% | 80%+ | New |

---

## Benefits Summary

### Maintainability
- **DRY Principle:** Eliminates ~500 lines of duplicated code
- **Single Responsibility:** Each file has one clear purpose
- **Separation of Concerns:** Routes, services, repositories are separate
- **Easier Onboarding:** New developers can understand architecture quickly

### Testability
- **Unit Tests:** Services can be tested in isolation
- **Integration Tests:** Repository layer can be mocked
- **End-to-End Tests:** Full flow can be tested without hitting real DB

### Flexibility
- **Database Agnostic:** Can swap PostgreSQL for another DB by updating repository
- **Email Provider Swap:** Can switch from SMTP to SendGrid by updating email service
- **PDF Library Swap:** Can change from PDFKit to another library in one place

### Performance
- **No Performance Impact:** Refactoring is purely structural
- **Future Optimization:** Can add caching at service layer
- **Easier Profiling:** Can measure performance of individual services

### Business Impact
- **Faster Feature Development:** New features can reuse services
- **Reduced Bugs:** Less code duplication means fewer places for bugs
- **Easier Debugging:** Centralized logic is easier to trace
- **Better Documentation:** Services have clear APIs

---

## Next Steps

1. **Get Approval:** Present this plan to stakeholders
2. **Allocate Resources:** 1 senior developer, 3 weeks
3. **Create Feature Branch:** `feature/voucher-service-refactor`
4. **Implement Phase 1:** Service layer extraction (Week 1)
5. **Implement Phase 2:** Route refactoring (Week 2)
6. **Implement Phase 3:** Database abstraction (Week 3)
7. **Code Review:** Comprehensive review before merge
8. **Deploy to Staging:** Test extensively
9. **Deploy to Production:** Gradual rollout with monitoring
10. **Remove Deprecated Code:** After 2-week transition period

---

## Questions & Answers

**Q: Will this break existing functionality?**
A: No. We'll maintain backward compatibility during the transition.

**Q: How long is the transition period?**
A: 2 weeks. Old endpoints will show deprecation warnings but continue to work.

**Q: What if we find bugs after deployment?**
A: We have a rollback plan. Old route files are kept in `legacy/` folder.

**Q: Will performance be affected?**
A: No performance impact. This is purely structural refactoring.

**Q: Do we need to update the frontend?**
A: Yes, but gradually. Old API endpoints will continue to work during transition.

**Q: What about the database schema?**
A: Phase 3 adds a repository layer but doesn't change the schema. Schema normalization is optional and can be done later.

---

**Document Version:** 1.0
**Last Updated:** 2026-01-20
**Author:** Claude Code Architecture Analysis
**Status:** DRAFT - Pending Approval
