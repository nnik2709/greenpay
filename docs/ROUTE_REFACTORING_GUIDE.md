# ROUTE REFACTORING GUIDE

**Date**: 2026-01-06
**Objective**: Break down large monolithic route files into maintainable modules

---

## Files Requiring Refactoring

| File | Current Lines | Target Lines | Priority |
|------|---------------|--------------|----------|
| `vouchers.js` | 1,185 | < 300 | P0 (Critical) |
| `invoices-gst.js` | 1,103 | < 300 | P0 (Critical) |
| `public-purchases.js` | 990 | < 300 | P1 (High) |
| `buy-online.js` | 839 | < 300 | P1 (High) |
| `quotations.js` | 577 | < 300 | P2 (Medium) |

---

## Refactoring Pattern: MVC-like Separation

Split each large route file into:

```
backend/modules/vouchers/
├── routes.js           # Express routes only (< 200 lines)
├── controller.js       # Request/response handling (< 300 lines)
├── service.js          # Business logic & database (< 300 lines)
├── validators/
│   ├── create.js       # Validation for creating vouchers
│   ├── validate.js     # Validation for voucher validation
│   └── email.js        # Validation for emailing vouchers
└── __tests__/
    ├── service.test.js
    ├── controller.test.js
    └── validators.test.js
```

---

## Example: Refactoring vouchers.js

### Current Structure (1,185 lines - MONOLITHIC)

```javascript
// routes/vouchers.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const PDFDocument = require('pdfkit');
const { body, param } = require('express-validator');
// ... 50 more imports

// Route 1: Get all vouchers (50 lines)
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT ...');
    // ... 45 lines of data transformation
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route 2: Create voucher (80 lines)
router.post('/', auth, [
  body('passport').trim().notEmpty(),
  // ... 20 lines of validation
], async (req, res) => {
  // ... 60 lines of business logic
});

// Route 3: Generate PDF (120 lines)
router.get('/:id/pdf', auth, async (req, res) => {
  // ... 120 lines of PDF generation
});

// ... 15 more routes, each 40-100 lines

module.exports = router;
```

**Problems**:
- Hard to find specific functionality
- Testing requires mocking everything
- Changes risk breaking unrelated features
- Can't reuse business logic elsewhere

---

### New Structure (MODULAR)

#### 1. Service Layer (`modules/vouchers/service.js`)

**Responsibility**: Business logic and database operations

```javascript
/**
 * Voucher Service
 *
 * Handles all voucher-related business logic
 */
const pool = require('../../config/database');
const { AppError, ErrorCodes } = require('../../middleware/errorHandler');

class VoucherService {
  /**
   * Get all vouchers
   *
   * @param {Object} filters - Query filters
   * @param {number} filters.limit - Results limit
   * @param {number} filters.offset - Results offset
   * @param {string} filters.status - Filter by status
   * @returns {Promise<Array>} Vouchers array
   */
  async getAllVouchers(filters = {}) {
    const {
      limit = 50,
      offset = 0,
      status = null
    } = filters;

    let query = 'SELECT * FROM vouchers';
    const params = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get voucher by ID
   *
   * @param {number} id - Voucher ID
   * @returns {Promise<Object>} Voucher object
   * @throws {AppError} If voucher not found
   */
  async getVoucherById(id) {
    const result = await pool.query(
      'SELECT * FROM vouchers WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError(
        'Voucher not found',
        404,
        ErrorCodes.VOUCHER_NOT_FOUND
      );
    }

    return result.rows[0];
  }

  /**
   * Get voucher by code
   *
   * @param {string} code - Voucher code
   * @returns {Promise<Object>} Voucher object
   * @throws {AppError} If voucher not found
   */
  async getVoucherByCode(code) {
    const result = await pool.query(
      'SELECT * FROM vouchers WHERE voucher_code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      throw new AppError(
        'Voucher not found',
        404,
        ErrorCodes.VOUCHER_NOT_FOUND
      );
    }

    return result.rows[0];
  }

  /**
   * Create new voucher
   *
   * @param {Object} voucherData - Voucher data
   * @returns {Promise<Object>} Created voucher
   * @throws {AppError} If voucher already exists
   */
  async createVoucher(voucherData) {
    const {
      passport,
      full_name,
      nationality,
      date_of_birth,
      gender,
      purpose_of_visit,
      created_by
    } = voucherData;

    // Check if voucher already exists for this passport
    const existing = await pool.query(
      'SELECT id FROM vouchers WHERE passport = $1 AND status = $2',
      [passport, 'active']
    );

    if (existing.rows.length > 0) {
      throw new AppError(
        'Active voucher already exists for this passport',
        409,
        ErrorCodes.ALREADY_EXISTS
      );
    }

    // Generate voucher code
    const voucher_code = this.generateVoucherCode();

    // Insert voucher
    const result = await pool.query(
      `INSERT INTO vouchers (
        voucher_code, passport, full_name, nationality,
        date_of_birth, gender, purpose_of_visit, created_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        voucher_code, passport, full_name, nationality,
        date_of_birth, gender, purpose_of_visit, created_by, 'active'
      ]
    );

    return result.rows[0];
  }

  /**
   * Generate unique voucher code
   *
   * @returns {string} 8-character voucher code
   */
  generateVoucherCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Validate voucher
   *
   * @param {string} code - Voucher code
   * @returns {Promise<Object>} Validated voucher
   * @throws {AppError} If voucher invalid, used, or expired
   */
  async validateVoucher(code) {
    const voucher = await this.getVoucherByCode(code);

    if (voucher.status === 'used') {
      throw new AppError(
        'Voucher has already been used',
        400,
        ErrorCodes.VOUCHER_ALREADY_USED
      );
    }

    if (voucher.status === 'expired') {
      throw new AppError(
        'Voucher has expired',
        400,
        ErrorCodes.VOUCHER_EXPIRED
      );
    }

    // Mark as validated
    await pool.query(
      'UPDATE vouchers SET validated_at = NOW() WHERE id = $1',
      [voucher.id]
    );

    return voucher;
  }

  /**
   * Mark voucher as used
   *
   * @param {string} code - Voucher code
   * @returns {Promise<Object>} Updated voucher
   */
  async useVoucher(code) {
    const voucher = await this.getVoucherByCode(code);

    await pool.query(
      `UPDATE vouchers
       SET status = 'used', used_at = NOW()
       WHERE id = $1`,
      [voucher.id]
    );

    return this.getVoucherById(voucher.id);
  }
}

module.exports = new VoucherService();
```

---

#### 2. Controller Layer (`modules/vouchers/controller.js`)

**Responsibility**: Handle HTTP requests/responses

```javascript
/**
 * Voucher Controller
 *
 * Handles HTTP request/response for voucher endpoints
 */
const voucherService = require('./service');
const VoucherTemplate = require('../../services/pdf/templates/VoucherTemplate');
const emailService = require('../../utils/emailService');

class VoucherController {
  /**
   * Get all vouchers
   *
   * @route GET /api/vouchers
   */
  async getAllVouchers(req, res, next) {
    try {
      const filters = {
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0,
        status: req.query.status || null
      };

      const vouchers = await voucherService.getAllVouchers(filters);

      res.json({
        vouchers,
        total: vouchers.length,
        limit: filters.limit,
        offset: filters.offset
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get voucher by ID
   *
   * @route GET /api/vouchers/:id
   */
  async getVoucherById(req, res, next) {
    try {
      const voucher = await voucherService.getVoucherById(req.params.id);
      res.json(voucher);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create new voucher
   *
   * @route POST /api/vouchers
   */
  async createVoucher(req, res, next) {
    try {
      const voucherData = {
        ...req.body,
        created_by: req.user.id
      };

      const voucher = await voucherService.createVoucher(voucherData);

      res.status(201).json({
        message: 'Voucher created successfully',
        voucher
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Generate voucher PDF
   *
   * @route GET /api/vouchers/:id/pdf
   */
  async generatePDF(req, res, next) {
    try {
      const voucher = await voucherService.getVoucherById(req.params.id);

      const template = new VoucherTemplate();
      const pdfBuffer = await template.generateVoucher(voucher);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=voucher-${voucher.voucher_code}.pdf`
      );
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Email voucher
   *
   * @route POST /api/vouchers/:id/email
   */
  async emailVoucher(req, res, next) {
    try {
      const voucher = await voucherService.getVoucherById(req.params.id);
      const { recipient_email } = req.body;

      // Generate PDF
      const template = new VoucherTemplate();
      const pdfBuffer = await template.generateVoucher(voucher);

      // Send email
      await emailService.sendVoucherEmail({
        ...voucher,
        recipient_email
      }, pdfBuffer);

      res.json({
        message: 'Voucher emailed successfully',
        email: recipient_email
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Validate voucher
   *
   * @route POST /api/vouchers/validate
   */
  async validateVoucher(req, res, next) {
    try {
      const { voucher_code } = req.body;
      const voucher = await voucherService.validateVoucher(voucher_code);

      res.json({
        valid: true,
        message: 'Voucher is valid',
        voucher
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new VoucherController();
```

---

#### 3. Validators (`modules/vouchers/validators/`)

**create.js**:
```javascript
const { body } = require('express-validator');

module.exports = [
  body('passport')
    .trim()
    .notEmpty().withMessage('Passport number is required')
    .isLength({ min: 6, max: 20 }).withMessage('Invalid passport number'),

  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ max: 200 }).withMessage('Name too long'),

  body('nationality')
    .trim()
    .notEmpty().withMessage('Nationality is required'),

  body('date_of_birth')
    .isISO8601().withMessage('Invalid date of birth'),

  body('gender')
    .isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender')
];
```

**validate.js**:
```javascript
const { body } = require('express-validator');

module.exports = [
  body('voucher_code')
    .trim()
    .matches(/^[A-Z0-9]{8}$/).withMessage('Invalid voucher code format')
];
```

**email.js**:
```javascript
const { body, param } = require('express-validator');

module.exports = [
  param('id')
    .isInt().withMessage('Invalid voucher ID'),

  body('recipient_email')
    .trim()
    .isEmail().withMessage('Valid email address required')
    .normalizeEmail()
    .isLength({ max: 254 }).withMessage('Email address too long')
];
```

---

#### 4. Routes (`modules/vouchers/routes.js`)

**Responsibility**: Define routes only

```javascript
/**
 * Voucher Routes
 *
 * Clean route definitions using controller and validators
 */
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const auth = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');

// Import validators
const createValidator = require('./validators/create');
const validateValidator = require('./validators/validate');
const emailValidator = require('./validators/email');

/**
 * @route   GET /api/vouchers
 * @desc    Get all vouchers
 * @access  Private (authenticated users)
 */
router.get('/',
  auth,
  asyncHandler(controller.getAllVouchers.bind(controller))
);

/**
 * @route   GET /api/vouchers/:id
 * @desc    Get voucher by ID
 * @access  Private
 */
router.get('/:id',
  auth,
  asyncHandler(controller.getVoucherById.bind(controller))
);

/**
 * @route   POST /api/vouchers
 * @desc    Create new voucher
 * @access  Private
 */
router.post('/',
  auth,
  createValidator,
  validate,
  asyncHandler(controller.createVoucher.bind(controller))
);

/**
 * @route   GET /api/vouchers/:id/pdf
 * @desc    Generate voucher PDF
 * @access  Private
 */
router.get('/:id/pdf',
  auth,
  asyncHandler(controller.generatePDF.bind(controller))
);

/**
 * @route   POST /api/vouchers/:id/email
 * @desc    Email voucher to recipient
 * @access  Private
 */
router.post('/:id/email',
  auth,
  emailValidator,
  validate,
  asyncHandler(controller.emailVoucher.bind(controller))
);

/**
 * @route   POST /api/vouchers/validate
 * @desc    Validate voucher code
 * @access  Private
 */
router.post('/validate',
  auth,
  validateValidator,
  validate,
  asyncHandler(controller.validateVoucher.bind(controller))
);

module.exports = router;
```

---

## Benefits of This Structure

### Before (Monolithic):
- ❌ 1,185 lines in one file
- ❌ Hard to find specific route
- ❌ Can't test business logic independently
- ❌ Difficult to reuse logic
- ❌ Every change touches giant file

### After (Modular):
- ✅ routes.js: 80 lines (route definitions)
- ✅ controller.js: 180 lines (HTTP handling)
- ✅ service.js: 250 lines (business logic)
- ✅ validators/: 60 lines total
- ✅ Easy to find and modify specific functionality
- ✅ Each layer can be tested independently
- ✅ Business logic reusable in other contexts
- ✅ Changes are isolated to specific files

---

## Migration Steps

### 1. Create Module Structure

```bash
mkdir -p backend/modules/vouchers/{validators,__tests__}
```

### 2. Extract Service Layer (Day 1)

1. Create `service.js`
2. Move all database operations from routes
3. Move business logic functions
4. Add error handling with AppError
5. Write unit tests

### 3. Extract Validators (Day 1)

1. Create validator files
2. Move validation schemas from routes
3. Test each validator

### 4. Create Controller (Day 2)

1. Create `controller.js`
2. Move request/response handling
3. Call service methods
4. Handle errors

### 5. Create New Routes File (Day 2)

1. Create clean `routes.js`
2. Wire up controller + validators
3. Use asyncHandler for error handling

### 6. Update Server (Day 2)

```javascript
// In backend/server.js
// OLD:
// const vouchersRouter = require('./routes/vouchers');

// NEW:
const vouchersRouter = require('./modules/vouchers/routes');

app.use('/api/vouchers', vouchersRouter);
```

### 7. Test Thoroughly (Day 3)

1. Run unit tests
2. Run integration tests
3. Manual testing
4. Check all endpoints work

### 8. Remove Old File (Day 3)

```bash
# Backup first
mv backend/routes/vouchers.js backend/routes/vouchers.js.old

# If all tests pass, delete backup after a week
```

---

## Testing the Refactored Code

```javascript
// backend/modules/vouchers/__tests__/service.test.js
const voucherService = require('../service');

describe('VoucherService', () => {
  describe('createVoucher', () => {
    it('should create voucher with unique code', async () => {
      const voucherData = {
        passport: 'AB123456',
        full_name: 'John Doe',
        nationality: 'Australia',
        // ...
      };

      const voucher = await voucherService.createVoucher(voucherData);

      expect(voucher).toHaveProperty('voucher_code');
      expect(voucher.voucher_code).toHaveLength(8);
      expect(voucher.passport).toBe('AB123456');
    });
  });
});
```

---

## Repeat for Other Large Files

Apply the same pattern to:
1. `invoices-gst.js` → `modules/invoices/`
2. `public-purchases.js` → `modules/purchases/`
3. `buy-online.js` → `modules/buy-online/`
4. `quotations.js` → `modules/quotations/`

---

**Prepared By**: Claude Code
**Date**: 2026-01-06
**Next**: Start with vouchers.js refactoring
