# Security Remediation Plan - PNG Green Fees System
**Date**: January 6, 2026
**Priority**: URGENT - Critical Security Issues
**Estimated Total Time**: 2-3 weeks (1 developer full-time)

---

## Overview

This plan addresses all security and architectural issues identified in the comprehensive architecture review, prioritized by:
1. **Severity** (Critical → High → Medium → Low)
2. **Risk** (Data breach → DoS → Performance)
3. **Dependencies** (some fixes enable others)
4. **Effort** (quick wins first where possible)

---

# PHASE 1: CRITICAL SECURITY FIXES (Days 1-3)
**Goal**: Eliminate immediate security threats
**Timeline**: 3 days
**Risk Level**: 🔴 CRITICAL

## Day 1 Morning: Emergency Patches (2-3 hours)

### 1.1 Remove Debug Logging Code ⚡ IMMEDIATE
**Priority**: CRITICAL
**Effort**: 5 minutes
**Risk**: Active data leakage

**File**: `backend/routes/invoices-gst.js`

**Action**:
```bash
# Line 180-182: DELETE entirely
```

**Before**:
```javascript
// #region agent log
fetch('http://127.0.0.1:7242/ingest/393aee6e-ef35-424a-a035-9f1cded26861',{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({
    sessionId:'debug-session',
    runId:'run1',
    hypothesisId:'H2',
    location:'invoices-gst.js:get/ start',
    message:'Fetching invoices start',
    data:{status,customer,from_date,to_date},
    timestamp:Date.now()
  })
}).catch(()=>{});
// #endregion
```

**After**:
```javascript
// DELETED - debug logging removed
```

**Verification**:
```bash
# Ensure no other fetch calls to localhost exist
grep -r "fetch.*127.0.0.1" backend/
grep -r "fetch.*localhost" backend/
```

---

### 1.2 Add Input Validation to Email Endpoint ⚡ URGENT
**Priority**: CRITICAL
**Effort**: 30 minutes
**Risk**: Email injection attacks

**File**: `backend/routes/vouchers.js` lines 1093-1170

**Action**: Add validation middleware

**Install validator**:
```bash
npm install express-validator
```

**Update endpoint**:
```javascript
const { body, param } = require('express-validator');
const validate = require('../middleware/validator');

// BEFORE
router.post('/:voucherCode/email', auth, async (req, res) => {

// AFTER
router.post('/:voucherCode/email',
  auth,
  [
    param('voucherCode')
      .trim()
      .matches(/^[A-Z0-9]{8}$/)
      .withMessage('Invalid voucher code format (must be 8 uppercase alphanumeric characters)'),
    body('recipient_email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email address required')
      .isLength({ max: 254 })
      .withMessage('Email address too long')
  ],
  validate,
  async (req, res) => {
    // existing code...
  }
);
```

**Verification**:
```bash
# Test with invalid inputs
curl -X POST https://greenpay.eywademo.cloud/api/vouchers/INVALID!/email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipient_email":"not-an-email"}'

# Should return 400 validation error
```

---

### 1.3 Enable Database SSL 🔒
**Priority**: CRITICAL
**Effort**: 15 minutes
**Risk**: Credential theft

**File**: `backend/config/database.js`

**Action**:
```javascript
// BEFORE
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false, // ❌ INSECURE
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20
});

// AFTER
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'false' ? false : {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: parseInt(process.env.DB_POOL_MAX) || 20,
  statement_timeout: 30000 // 30 second query timeout
});
```

**Update `.env`**:
```bash
# Add to .env file
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_POOL_MAX=20
```

**Verification**:
```bash
# Check SSL connection in logs
pm2 logs greenpay-api | grep -i ssl

# Should see SSL handshake messages
```

---

## Day 1 Afternoon: Rate Limiting (3-4 hours)

### 1.4 Implement Rate Limiting 🛡️
**Priority**: CRITICAL
**Effort**: 2-3 hours
**Risk**: Brute force attacks, DoS

**Install dependencies**:
```bash
npm install express-rate-limit rate-limit-redis ioredis
```

**Create middleware**: `backend/middleware/rateLimiter.js`

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

// Redis client for rate limiting
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 1, // Use separate DB for rate limiting
  enableOfflineQueue: false
});

redisClient.on('error', (err) => {
  console.error('❌ Redis rate limiter error:', err);
});

// Strict rate limit for authentication endpoints
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    error: 'Too many login attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// General API rate limit
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:api:'
  }),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests. Please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limit for resource-intensive operations
const heavyOperationLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:heavy:'
  }),
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 requests per 5 minutes
  message: {
    error: 'This operation is rate-limited. Please try again later.',
    retryAfter: '5 minutes'
  }
});

module.exports = {
  authLimiter,
  apiLimiter,
  heavyOperationLimiter
};
```

**Update `server.js`**:
```javascript
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');

// Apply rate limiting BEFORE routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', apiLimiter);

// Then apply routes
app.use('/api/auth', authRoutes);
// ... rest of routes
```

**Update `.env`**:
```bash
# Add Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

**Install Redis** (if not already installed):
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# macOS
brew install redis
brew services start redis
```

**Verification**:
```bash
# Test rate limiting
for i in {1..10}; do
  curl -X POST https://greenpay.eywademo.cloud/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "Attempt $i"
done

# Should get rate limited after 5 attempts
```

---

## Day 2: Authentication Performance Fix (6-8 hours)

### 2.1 Implement User Data Caching 🚀
**Priority**: CRITICAL
**Effort**: 4-5 hours
**Risk**: DoS vulnerability + poor performance

**Goal**: Cache user data in Redis to eliminate database queries on every request

**Create caching service**: `backend/services/userCache.js`

```javascript
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0, // Use DB 0 for user cache
  enableOfflineQueue: false
});

redis.on('connect', () => {
  console.log('✅ Redis user cache connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis user cache error:', err);
});

const USER_CACHE_TTL = 15 * 60; // 15 minutes

class UserCache {
  /**
   * Get user data from cache or database
   */
  static async getUser(userId, fetchFromDb) {
    try {
      // Try cache first
      const cacheKey = `user:${userId}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        console.log(`✅ User ${userId} loaded from cache`);
        return JSON.parse(cached);
      }

      // Cache miss - fetch from database
      console.log(`📊 User ${userId} cache miss - fetching from DB`);
      const user = await fetchFromDb(userId);

      if (user) {
        // Store in cache
        await redis.setex(cacheKey, USER_CACHE_TTL, JSON.stringify(user));
      }

      return user;
    } catch (error) {
      console.error('Error in user cache:', error);
      // Fallback to direct DB fetch on Redis error
      return await fetchFromDb(userId);
    }
  }

  /**
   * Invalidate user cache (call when user data changes)
   */
  static async invalidateUser(userId) {
    try {
      const cacheKey = `user:${userId}`;
      await redis.del(cacheKey);
      console.log(`🗑️ User ${userId} cache invalidated`);
    } catch (error) {
      console.error('Error invalidating user cache:', error);
    }
  }

  /**
   * Clear all user cache
   */
  static async clearAll() {
    try {
      const keys = await redis.keys('user:*');
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`🗑️ Cleared ${keys.length} user cache entries`);
      }
    } catch (error) {
      console.error('Error clearing user cache:', error);
    }
  }
}

module.exports = UserCache;
```

**Update auth middleware**: `backend/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const UserCache = require('../services/userCache');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user with caching
    const fetchUserFromDb = async (userId) => {
      const result = await db.query(
        `SELECT u.id, u.name, u.email, u."roleId", u."isActive", r.name as role
         FROM "User" u
         JOIN "Role" r ON u."roleId" = r.id
         WHERE u.id = $1 AND u."isActive" = true`,
        [userId]
      );
      return result.rows[0] || null;
    };

    const user = await UserCache.getUser(decoded.userId, fetchUserFromDb);

    if (!user) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Role-based authorization middleware
const checkRole = (...roles) => {
  return (req, res, next) => {
    // Use data already loaded by auth middleware - NO MORE DB QUERY!
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.user?.role
      });
    }

    req.userRole = req.user.role;
    next();
  };
};

module.exports = { auth, checkRole };
```

**Update user modification endpoints to invalidate cache**:

`backend/routes/users.js`:
```javascript
const UserCache = require('../services/userCache');

// After updating user
router.put('/:id', auth, checkRole('Flex_Admin'), async (req, res) => {
  try {
    // ... update user in database ...

    // Invalidate cache
    await UserCache.invalidateUser(req.params.id);

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    // ...
  }
});

// After deleting/deactivating user
router.delete('/:id', auth, checkRole('Flex_Admin'), async (req, res) => {
  try {
    // ... deactivate user in database ...

    // Invalidate cache
    await UserCache.invalidateUser(req.params.id);

    res.json({ success: true });
  } catch (error) {
    // ...
  }
});
```

**Performance Impact**:
- **Before**: 2 DB queries per authenticated request (auth + role check)
- **After**: 0 DB queries per request (cached for 15 minutes)
- **Improvement**: ~50-100ms latency reduction per request

**Verification**:
```bash
# Monitor Redis cache hits
redis-cli monitor | grep "user:"

# Check PM2 logs for cache hit messages
pm2 logs greenpay-api | grep "cache"

# Load test to verify performance
ab -n 1000 -c 10 -H "Authorization: Bearer $TOKEN" \
  https://greenpay.eywademo.cloud/api/vouchers
```

---

## Day 3: Security Headers & Remaining Critical Fixes (4-6 hours)

### 3.1 Add Security Headers with Helmet 🛡️
**Priority**: HIGH
**Effort**: 1 hour

**Install**:
```bash
npm install helmet
```

**Update `server.js`**:
```javascript
const helmet = require('helmet');

// Add after trust proxy, before CORS
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // For inline styles in React
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true
}));

app.use(cors({
  // ... existing CORS config
}));
```

---

### 3.2 Add Comprehensive Input Validation ✅
**Priority**: HIGH
**Effort**: 3-4 hours

**Create validation schemas**: `backend/validators/schemas.js`

```javascript
const { body, param, query } = require('express-validator');

const schemas = {
  // Voucher code validation
  voucherCode: param('voucherCode')
    .trim()
    .matches(/^[A-Z0-9]{8}$/)
    .withMessage('Invalid voucher code format'),

  // Email validation
  email: body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Valid email required'),

  // Passport number validation
  passportNumber: body('passport_number')
    .trim()
    .matches(/^[A-Z0-9]{6,12}$/)
    .withMessage('Invalid passport number format'),

  // Amount validation
  amount: body('amount')
    .isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('Amount must be between 0.01 and 999999.99'),

  // Pagination
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .toInt()
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt()
      .withMessage('Limit must be between 1 and 100')
  ],

  // Date validation
  date: (field) => body(field)
    .optional()
    .isISO8601()
    .toDate()
    .withMessage(`${field} must be a valid date`),

  // Nationality validation
  nationality: body('nationality')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Nationality must contain only letters and spaces')
};

module.exports = schemas;
```

**Apply to all critical endpoints**:

`backend/routes/vouchers.js`:
```javascript
const schemas = require('../validators/schemas');
const validate = require('../middleware/validator');

// Validate voucher lookup
router.get('/:voucherCode',
  auth,
  [schemas.voucherCode],
  validate,
  async (req, res) => { /* ... */ }
);

// Validate email endpoint (already done in 1.2)
router.post('/:voucherCode/email',
  auth,
  [
    schemas.voucherCode,
    schemas.email.withOptions({ field: 'recipient_email' })
  ],
  validate,
  async (req, res) => { /* ... */ }
);
```

`backend/routes/passports.js`:
```javascript
router.post('/',
  auth,
  checkRole('Admin', 'Manager', 'Agent', 'Flex_Admin', 'Counter_Agent', 'Finance_Manager'),
  [
    schemas.passportNumber,
    body('full_name').optional().trim().isLength({ min: 1, max: 200 }),
    schemas.nationality,
    schemas.date('date_of_birth'),
    schemas.date('issue_date'),
    schemas.date('expiry_date')
  ],
  validate,
  async (req, res) => { /* ... */ }
);
```

---

### 3.3 Add Audit Logging 📝
**Priority**: HIGH
**Effort**: 2 hours

**Create audit service**: `backend/services/auditLogger.js`

```javascript
const db = require('../config/database');

class AuditLogger {
  static async log(event) {
    try {
      await db.query(
        `INSERT INTO audit_logs (user_id, action, resource, resource_id, ip_address, user_agent, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          event.userId,
          event.action, // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'FAILED_LOGIN'
          event.resource, // 'voucher', 'passport', 'user', etc.
          event.resourceId,
          event.ipAddress,
          event.userAgent,
          JSON.stringify(event.details || {})
        ]
      );
    } catch (error) {
      console.error('❌ Audit log error:', error);
      // Don't throw - logging should never break the app
    }
  }

  static async logAuthFailure(email, ipAddress, reason) {
    await this.log({
      userId: null,
      action: 'FAILED_LOGIN',
      resource: 'auth',
      resourceId: email,
      ipAddress,
      userAgent: null,
      details: { reason }
    });
  }

  static async logAuthSuccess(userId, ipAddress, userAgent) {
    await this.log({
      userId,
      action: 'LOGIN',
      resource: 'auth',
      resourceId: userId,
      ipAddress,
      userAgent
    });
  }
}

module.exports = AuditLogger;
```

**Create audit_logs table**:
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES "User"(id),
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);
```

**Apply to auth routes**:
```javascript
const AuditLogger = require('../services/auditLogger');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ... authentication logic ...

    if (!user) {
      await AuditLogger.logAuthFailure(email, req.ip, 'Invalid credentials');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await AuditLogger.logAuthSuccess(user.id, req.ip, req.get('user-agent'));

    res.json({ token, user });
  } catch (error) {
    // ...
  }
});
```

---

# PHASE 2: HIGH PRIORITY FIXES (Days 4-7)
**Goal**: Address major code quality and performance issues
**Timeline**: 4 days

## Day 4-5: Refactor Large Route Files (12-16 hours)

### 4.1 Break Up `vouchers.js` (1,172 lines) 🔨
**Priority**: HIGH
**Effort**: 8-10 hours

**New structure**:
```
backend/
├── routes/
│   └── vouchers/
│       ├── index.js              # Main router aggregator
│       ├── individual.js         # Individual voucher operations
│       ├── corporate.js          # Corporate batch operations
│       ├── validation.js         # Validation endpoints
│       └── email.js              # Email operations
├── controllers/
│   └── vouchers/
│       ├── individualController.js
│       ├── corporateController.js
│       ├── validationController.js
│       └── emailController.js
└── services/
    └── vouchers/
        ├── voucherService.js     # Business logic
        ├── emailService.js       # Email operations
        └── pdfService.js         # PDF generation
```

**Implementation**:

**Step 1**: Create service layer (`services/vouchers/voucherService.js`)
```javascript
const db = require('../../config/database');

class VoucherService {
  async findByCode(voucherCode) {
    const result = await db.query(
      `SELECT ip.*, p.passport_number, p.nationality, p.surname, p.given_name
       FROM individual_purchases ip
       LEFT JOIN passports p ON p.id = ip.passport_id
       WHERE ip.voucher_code = $1`,
      [voucherCode]
    );
    return result.rows[0] || null;
  }

  async validateVoucher(voucherCode) {
    const voucher = await this.findByCode(voucherCode);

    if (!voucher) {
      return { valid: false, reason: 'Voucher not found' };
    }

    if (voucher.used) {
      return { valid: false, reason: 'Voucher already used' };
    }

    const expiryDate = new Date(voucher.valid_until);
    if (expiryDate < new Date()) {
      return { valid: false, reason: 'Voucher expired' };
    }

    return { valid: true, voucher };
  }

  async markAsUsed(voucherCode, userId) {
    const result = await db.query(
      `UPDATE individual_purchases
       SET used = true, used_at = NOW(), used_by = $2
       WHERE voucher_code = $1
       RETURNING *`,
      [voucherCode, userId]
    );
    return result.rows[0];
  }
}

module.exports = new VoucherService();
```

**Step 2**: Create controller (`controllers/vouchers/emailController.js`)
```javascript
const voucherService = require('../../services/vouchers/voucherService');
const emailService = require('../../services/vouchers/emailService');
const AuditLogger = require('../../services/auditLogger');

class EmailController {
  async sendVoucherEmail(req, res) {
    try {
      const { voucherCode } = req.params;
      const { recipient_email } = req.body;

      // Find voucher
      const voucher = await voucherService.findByCode(voucherCode);
      if (!voucher) {
        return res.status(404).json({ error: 'Voucher not found' });
      }

      // Send email
      await emailService.sendVoucherEmail(voucher, recipient_email);

      // Audit log
      await AuditLogger.log({
        userId: req.userId,
        action: 'EMAIL_SENT',
        resource: 'voucher',
        resourceId: voucherCode,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { recipient: recipient_email }
      });

      res.json({
        success: true,
        message: `Voucher ${voucherCode} emailed to ${recipient_email}`
      });
    } catch (error) {
      console.error('Error emailing voucher:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  }
}

module.exports = new EmailController();
```

**Step 3**: Create route (`routes/vouchers/email.js`)
```javascript
const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const schemas = require('../../validators/schemas');
const validate = require('../../middleware/validator');
const emailController = require('../../controllers/vouchers/emailController');

router.post('/:voucherCode/email',
  auth,
  [schemas.voucherCode, schemas.email],
  validate,
  emailController.sendVoucherEmail
);

module.exports = router;
```

**Step 4**: Aggregate routes (`routes/vouchers/index.js`)
```javascript
const express = require('express');
const router = express.Router();

const individualRoutes = require('./individual');
const corporateRoutes = require('./corporate');
const validationRoutes = require('./validation');
const emailRoutes = require('./email');

router.use('/', individualRoutes);
router.use('/corporate', corporateRoutes);
router.use('/validate', validationRoutes);
router.use('/', emailRoutes);

module.exports = router;
```

**Repeat for other large files**:
- `invoices-gst.js` (1,114 lines)
- `public-purchases.js` (990 lines)
- `buy-online.js` (839 lines)

---

## Day 6: Remove Code Duplication (6-8 hours)

### 6.1 Consolidate PDF Generation 📄
**Priority**: HIGH
**Effort**: 4-5 hours

**Goal**: Single source of truth for PDF generation

**Action**: Remove duplicate from `invoices-gst.js` lines 38-104

**Before** (duplicate code exists in multiple files):
- `backend/utils/pdfGenerator.js` - Main implementation
- `backend/routes/invoices-gst.js` lines 38-104 - Duplicate

**After** (single source):
- `backend/services/pdfService.js` - Unified service

**Create**: `backend/services/pdfService.js`
```javascript
const PDFDocument = require('pdfkit');
const bwipjs = require('bwip-js');
const path = require('path');
const fs = require('fs').promises;

class PDFService {
  constructor() {
    this.logoCache = null;
  }

  // Load and cache logos on first use
  async loadLogos() {
    if (this.logoCache) return this.logoCache;

    try {
      const [ccdaLogo, pngEmblem] = await Promise.all([
        fs.readFile(path.join(__dirname, '../assets/logos/ccda-logo.png')),
        fs.readFile(path.join(__dirname, '../assets/logos/png-emblem.png'))
      ]);

      this.logoCache = { ccdaLogo, pngEmblem };
      console.log('✅ PDF logos cached');
      return this.logoCache;
    } catch (error) {
      console.error('❌ Error loading logos:', error);
      return null;
    }
  }

  // Generate barcodes in batch
  async generateBarcodes(codes) {
    return Promise.all(
      codes.map(code => bwipjs.toBuffer({
        bcid: 'code128',
        text: code,
        scale: 3,
        height: 15,
        includetext: false,
        paddingwidth: 10,
        paddingheight: 5
      }))
    );
  }

  // Generate voucher PDF
  async generateVoucherPDF(vouchers, companyName = null) {
    const logos = await this.loadLogos();
    const barcodes = await this.generateBarcodes(
      vouchers.map(v => v.voucher_code || v.code)
    );

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 60 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      for (let i = 0; i < vouchers.length; i++) {
        if (i > 0) doc.addPage();
        this.renderVoucherPage(doc, vouchers[i], barcodes[i], logos, companyName);
      }

      doc.end();
    });
  }

  renderVoucherPage(doc, voucher, barcodeBuffer, logos, companyName) {
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 60;
    let yPos = margin;

    // Render logos (from cache)
    if (logos) {
      const logoSize = 90;
      const logoGap = 80;
      const totalWidth = (logoSize * 2) + logoGap;
      const leftX = (pageWidth - totalWidth) / 2;
      const rightX = leftX + logoSize + logoGap;

      doc.image(logos.ccdaLogo, leftX, yPos, { width: logoSize });
      doc.image(logos.pngEmblem, rightX, yPos, { width: logoSize });
      yPos += logoSize + 30;
    }

    // GREEN CARD title
    doc.fontSize(48)
       .fillColor('#4CAF50')
       .text('GREEN CARD', margin, yPos, {
         width: pageWidth - (margin * 2),
         align: 'center'
       });
    yPos += 65;

    // Green line
    doc.moveTo(margin, yPos)
       .lineTo(pageWidth - margin, yPos)
       .lineWidth(3)
       .stroke('#4CAF50');
    yPos += 25;

    // Subtitle
    doc.fontSize(20)
       .fillColor('#000000')
       .text('Foreign Passport Holder', margin, yPos, {
         width: pageWidth - (margin * 2),
         align: 'center'
       });
    yPos += 60;

    // Voucher code
    const voucherCode = voucher.voucher_code || voucher.code;
    doc.fontSize(16).text('Coupon Number:', margin + 20, yPos);
    doc.fontSize(20).text(voucherCode, 0, yPos, {
      width: pageWidth - margin - 20,
      align: 'right'
    });
    yPos += 60;

    // Barcode
    if (barcodeBuffer) {
      const barcodeWidth = 350;
      const barcodeHeight = 80;
      const barcodeX = (pageWidth - barcodeWidth) / 2;
      doc.image(barcodeBuffer, barcodeX, yPos, {
        width: barcodeWidth,
        height: barcodeHeight
      });
      yPos += barcodeHeight + 20;
    }

    // ... rest of voucher rendering
  }

  // Generate invoice PDF
  async generateInvoicePDF(invoice, lineItems) {
    // Implementation for invoices
  }
}

module.exports = new PDFService();
```

**Delete duplicate code**:
```javascript
// DELETE from invoices-gst.js lines 38-104
// const generateVouchersPDF = async (vouchers, companyName) => { ... }

// REPLACE with:
const pdfService = require('../services/pdfService');

// Use: await pdfService.generateVoucherPDF(vouchers, companyName);
```

**Performance improvement**:
- Before: 100 vouchers = ~15-20 seconds
- After: 100 vouchers = ~2-3 seconds (8x faster!)

---

## Day 7: Standardize Error Handling (6-8 hours)

### 7.1 Centralized Error Handler 🚨
**Priority**: HIGH
**Effort**: 4 hours

**Create**: `backend/middleware/errorHandler.js`

```javascript
class ApplicationError extends Error {
  constructor(message, statusCode, code, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

class ValidationError extends ApplicationError {
  constructor(message, details = {}) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends ApplicationError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends ApplicationError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends ApplicationError {
  constructor(resource, identifier) {
    super(`${resource} not found`, 404, 'NOT_FOUND', { resource, identifier });
  }
}

class ConflictError extends ApplicationError {
  constructor(message, details = {}) {
    super(message, 409, 'CONFLICT', details);
  }
}

// Error mapping for database errors
const DB_ERROR_MAP = {
  '23505': { status: 409, code: 'DUPLICATE_ENTRY', message: 'Record already exists' },
  '23503': { status: 400, code: 'FOREIGN_KEY_VIOLATION', message: 'Related record not found' },
  '22P02': { status: 400, code: 'INVALID_INPUT', message: 'Invalid input format' },
  '42P01': { status: 500, code: 'TABLE_NOT_FOUND', message: 'Database schema error' }
};

const handleDatabaseError = (error) => {
  const mapped = DB_ERROR_MAP[error.code];
  if (mapped) {
    return new ApplicationError(
      mapped.message,
      mapped.status,
      mapped.code,
      { constraint: error.constraint, detail: error.detail }
    );
  }
  return new ApplicationError('Database error', 500, 'DATABASE_ERROR');
};

const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';

  // Log error
  console.error('❌ Error:', {
    message: err.message,
    code: err.code,
    stack: isDev ? err.stack : undefined,
    path: req.path,
    method: req.method,
    userId: req.userId
  });

  // Database errors
  if (err.code && err.code.match(/^[0-9]{5}$/)) {
    err = handleDatabaseError(err);
  }

  // Application errors
  if (err instanceof ApplicationError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: isDev ? err.details : undefined
      }
    });
  }

  // Unknown errors - don't leak details
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: isDev ? { message: err.message, stack: err.stack } : undefined
    }
  });
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  ApplicationError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  errorHandler,
  asyncHandler
};
```

**Update `server.js`**:
```javascript
const { errorHandler } = require('./middleware/errorHandler');

// ... all routes ...

// Error handler MUST be last middleware
app.use(errorHandler);
```

**Update routes to use error classes**:
```javascript
const { NotFoundError, ConflictError, asyncHandler } = require('../middleware/errorHandler');

router.get('/:id', auth, asyncHandler(async (req, res) => {
  const voucher = await voucherService.findByCode(req.params.id);

  if (!voucher) {
    throw new NotFoundError('Voucher', req.params.id);
  }

  res.json(voucher);
}));
```

---

# PHASE 3: MEDIUM PRIORITY (Days 8-12)
**Goal**: Testing infrastructure and monitoring
**Timeline**: 5 days

## Day 8-10: Add Unit Tests (16-20 hours)

### 8.1 Setup Testing Infrastructure 🧪
**Priority**: MEDIUM
**Effort**: 2 hours

**Install dependencies**:
```bash
npm install --save-dev jest supertest @types/jest
```

**Configure Jest**: `jest.config.js`
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/node_modules/**',
    '!backend/tests/**'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

**Update `package.json`**:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration"
  }
}
```

---

### 8.2 Write Unit Tests 📝
**Priority**: MEDIUM
**Effort**: 12-14 hours

**Test structure**:
```
tests/
├── setup.js
├── unit/
│   ├── services/
│   │   ├── voucherService.test.js
│   │   ├── pdfService.test.js
│   │   └── userCache.test.js
│   ├── middleware/
│   │   ├── auth.test.js
│   │   └── rateLimiter.test.js
│   └── utils/
│       └── validators.test.js
└── integration/
    ├── api/
    │   ├── vouchers.test.js
    │   ├── auth.test.js
    │   └── passports.test.js
    └── database/
        └── queries.test.js
```

**Example unit test**: `tests/unit/services/voucherService.test.js`
```javascript
const voucherService = require('../../../backend/services/vouchers/voucherService');
const db = require('../../../backend/config/database');

jest.mock('../../../backend/config/database');

describe('VoucherService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateVoucher', () => {
    it('should return invalid for non-existent voucher', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await voucherService.validateVoucher('INVALID1');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Voucher not found');
    });

    it('should return invalid for used voucher', async () => {
      db.query.mockResolvedValue({
        rows: [{ voucher_code: 'TEST1234', used: true }]
      });

      const result = await voucherService.validateVoucher('TEST1234');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Voucher already used');
    });

    it('should return valid for unused non-expired voucher', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      db.query.mockResolvedValue({
        rows: [{
          voucher_code: 'TEST1234',
          used: false,
          valid_until: futureDate.toISOString()
        }]
      });

      const result = await voucherService.validateVoucher('TEST1234');

      expect(result.valid).toBe(true);
      expect(result.voucher).toBeDefined();
    });
  });
});
```

**Example integration test**: `tests/integration/api/auth.test.js`
```javascript
const request = require('supertest');
const app = require('../../../backend/server');
const db = require('../../../backend/config/database');

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('should return 400 for missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
    });

    it('should return token for valid credentials', async () => {
      // This requires test database with seed data
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@greenpay.com',
          password: 'testpassword'
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
    });

    it('should rate limit after 5 failed attempts', async () => {
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@test.com', password: 'wrong' });
      }

      // 6th attempt should be rate limited
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrong' });

      expect(res.status).toBe(429);
      expect(res.body.error).toContain('Too many');
    });
  });
});
```

**Run tests**:
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

---

## Day 11-12: Monitoring & Logging (12-16 hours)

### 11.1 Centralized Logging with Winston 📊
**Priority**: MEDIUM
**Effort**: 4-5 hours

**Install**:
```bash
npm install winston winston-daily-rotate-file
```

**Create**: `backend/config/logger.js`
```javascript
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(logColors);

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

const transports = [
  // Console logging
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'info'
  }),

  // Error log file
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d'
  }),

  // Combined log file
  new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d'
  })
];

const logger = winston.createLogger({
  levels: logLevels,
  format: logFormat,
  transports,
  exceptionHandlers: [
    new DailyRotateFile({
      filename: 'logs/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: 'logs/rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

module.exports = logger;
```

**Replace all `console.log`**:
```javascript
// BEFORE
console.log('User logged in:', userId);
console.error('Database error:', error);

// AFTER
const logger = require('./config/logger');

logger.info('User logged in', { userId, email });
logger.error('Database error', { error: error.message, stack: error.stack });
```

**Add request logging middleware**:
```javascript
const logger = require('./config/logger');
const morgan = require('morgan');

// Morgan middleware for HTTP request logging
const morganFormat = ':remote-addr :method :url :status :res[content-length] - :response-time ms';

app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.http(message.trim())
  }
}));
```

---

### 11.2 Add Performance Monitoring 📈
**Priority**: MEDIUM
**Effort**: 3-4 hours

**Install**:
```bash
npm install @sentry/node @sentry/profiling-node
```

**Configure Sentry**: `backend/config/sentry.js`
```javascript
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.1, // 10% of transactions
  profilesSampleRate: 0.1,
  integrations: [
    new ProfilingIntegration()
  ],
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry event (dev):', event);
      return null;
    }
    return event;
  }
});

module.exports = Sentry;
```

**Update `server.js`**:
```javascript
const Sentry = require('./config/sentry');

// Sentry request handler (must be first)
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// ... all middleware and routes ...

// Sentry error handler (must be before other error handlers)
app.use(Sentry.Handlers.errorHandler());

// Custom error handler
app.use(errorHandler);
```

---

### 11.3 Health Check Endpoint 🏥
**Priority**: MEDIUM
**Effort**: 1 hour

**Create**: `backend/routes/health.js`
```javascript
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {}
  };

  // Check database
  try {
    await db.query('SELECT 1');
    health.checks.database = { status: 'healthy' };
  } catch (error) {
    health.checks.database = { status: 'unhealthy', error: error.message };
    health.status = 'degraded';
  }

  // Check Redis
  try {
    await redis.ping();
    health.checks.redis = { status: 'healthy' };
  } catch (error) {
    health.checks.redis = { status: 'unhealthy', error: error.message };
    health.status = 'degraded';
  }

  // Check disk space
  const diskUsage = process.memoryUsage();
  health.checks.memory = {
    status: diskUsage.heapUsed < (diskUsage.heapTotal * 0.9) ? 'healthy' : 'warning',
    heapUsed: `${Math.round(diskUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(diskUsage.heapTotal / 1024 / 1024)}MB`
  };

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get('/health/ready', async (req, res) => {
  // Kubernetes readiness probe
  try {
    await db.query('SELECT 1');
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, error: error.message });
  }
});

router.get('/health/live', (req, res) => {
  // Kubernetes liveness probe
  res.status(200).json({ alive: true });
});

module.exports = router;
```

**Add to `server.js`**:
```javascript
const healthRoutes = require('./routes/health');
app.use('/api', healthRoutes);
```

---

# PHASE 4: DEPLOYMENT & VERIFICATION (Days 13-14)
**Goal**: Deploy all fixes to production and verify
**Timeline**: 2 days

## Day 13: Deployment Preparation

### 13.1 Create Deployment Checklist ✅
```markdown
## Pre-Deployment Checklist

Backend:
- [ ] All tests passing (`npm test`)
- [ ] Coverage > 50%
- [ ] No ESLint errors
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] Redis installed and configured
- [ ] PM2 ecosystem file updated
- [ ] Logs directory created
- [ ] Backup current production code

Frontend:
- [ ] Production build successful
- [ ] No console errors in build
- [ ] Assets optimized
- [ ] Environment variables set

Database:
- [ ] Backup production database
- [ ] Migration scripts tested on staging
- [ ] Rollback scripts prepared
- [ ] audit_logs table created

Infrastructure:
- [ ] Redis running
- [ ] SSL certificates valid
- [ ] Nginx configuration updated
- [ ] Firewall rules configured
- [ ] Monitoring dashboards set up
```

### 13.2 Database Migrations 🗄️

**Create audit_logs table**:
```sql
-- Run on production database
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES "User"(id),
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);
```

### 13.3 Environment Variables Update 🔧

**Update `.env` on production server**:
```bash
# Database
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_POOL_MAX=20

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Logging
LOG_LEVEL=info
NODE_ENV=production

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn_here
```

---

## Day 14: Production Deployment & Verification

### 14.1 Deployment Steps 🚀

**Step 1: Backup everything**
```bash
# SSH to production server
ssh root@165.22.52.100

# Backup current code
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz backend/ dist/

# Backup database
PGPASSWORD='GreenPay2025!Secure#PG' pg_dump -h 165.22.52.100 -U greenpay greenpay > backup-db-$(date +%Y%m%d-%H%M%S).sql
```

**Step 2: Upload files via CloudPanel File Manager**
- Upload `backend/` directory
- Upload `dist/` directory
- Verify files uploaded correctly

**Step 3: Install dependencies**
```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
npm install

# Install Redis
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Step 4: Run database migrations**
```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -f migrations/create-audit-logs.sql
```

**Step 5: Restart backend**
```bash
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 50
```

---

### 14.2 Verification Tests 🧪

**Test 1: Health Check**
```bash
curl https://greenpay.eywademo.cloud/api/health
# Should return: {"status":"ok", "checks":{"database":"healthy","redis":"healthy"}}
```

**Test 2: Authentication Performance**
```bash
# Load test with authenticated requests
ab -n 100 -c 10 \
  -H "Authorization: Bearer $TOKEN" \
  https://greenpay.eywademo.cloud/api/vouchers

# Should show improved response times (< 100ms avg)
```

**Test 3: Rate Limiting**
```bash
# Try 10 failed logins
for i in {1..10}; do
  curl -X POST https://greenpay.eywademo.cloud/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# Should get rate limited after 5 attempts
```

**Test 4: Email Validation**
```bash
# Try invalid email
curl -X POST https://greenpay.eywademo.cloud/api/vouchers/TEST1234/email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipient_email":"not-an-email"}'

# Should return 400 validation error
```

**Test 5: Check Logs**
```bash
# Check Winston logs
tail -f /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/logs/combined-$(date +%Y-%m-%d).log

# Check PM2 logs
pm2 logs greenpay-api --lines 100
```

**Test 6: Verify Redis Cache**
```bash
redis-cli monitor | grep "user:"
# Make authenticated request and watch cache operations
```

**Test 7: Audit Logs**
```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;"
# Should see recent login/action logs
```

---

# Summary Timeline

| Phase | Days | Critical Deliverables |
|-------|------|----------------------|
| **Phase 1: Critical Security** | 1-3 | Debug logging removed, SSL enabled, rate limiting, auth caching |
| **Phase 2: High Priority** | 4-7 | Code refactored, duplication removed, errors standardized |
| **Phase 3: Medium Priority** | 8-12 | Tests added (50% coverage), logging centralized, monitoring |
| **Phase 4: Deployment** | 13-14 | Production deployment, verification |

**Total: 14 days (2.8 weeks)**

---

# Success Metrics

**Security**:
- ✅ 0 critical vulnerabilities
- ✅ All endpoints validated
- ✅ Rate limiting active
- ✅ Database SSL enabled
- ✅ Audit logging functional

**Performance**:
- ✅ Auth latency < 50ms (from 100ms)
- ✅ 0 database queries for cached users
- ✅ PDF generation 8x faster
- ✅ API response time < 200ms avg

**Code Quality**:
- ✅ Largest file < 500 lines (from 1,172)
- ✅ Code duplication < 10% (from 40%)
- ✅ Test coverage > 50%
- ✅ All errors use standard format

**Monitoring**:
- ✅ Centralized logging active
- ✅ Health checks responding
- ✅ Performance monitoring enabled
- ✅ Audit trail complete

---

# Rollback Plan

If critical issues occur:

```bash
# 1. Stop current process
pm2 stop greenpay-api

# 2. Restore backup
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz

# 3. Restart
pm2 restart greenpay-api

# 4. Restore database if needed
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay < backup-db-YYYYMMDD-HHMMSS.sql
```

---

**Document prepared**: January 6, 2026
**Next review**: After Phase 4 completion
