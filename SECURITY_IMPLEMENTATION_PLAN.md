# Security Implementation Plan - PNG Green Fees System

**Objective**: Separate development (relaxed) and production (hardened) security configurations

**Status**: Implementation Guide
**Date**: 2025-01-15

---

## Strategy Overview

### Development Environment (Localhost)
- **Goal**: Easy debugging and fast development
- **Security**: Relaxed (verbose logging, no rate limits)
- **Environment**: `NODE_ENV=development` or `import.meta.env.DEV`

### Production Environment (Live Server)
- **Goal**: Maximum security and compliance
- **Security**: Hardened (encrypted keys, rate limits, minimal logging)
- **Environment**: `NODE_ENV=production` or `import.meta.env.PROD`

---

## Implementation Phases

### Phase 1: Critical Security Fixes (Production Only) 🔴
### Phase 2: High Priority Security (Production Only) 🟠
### Phase 3: Development/Production Configuration Management

---

## File Structure for Security Improvements

```
src/
├── lib/
│   ├── logger.js                    # NEW: Environment-aware logging
│   ├── rateLimiter.js               # NEW: Rate limiting (production only)
│   ├── security/
│   │   ├── apiKeyEncryption.js      # NEW: Encrypt/decrypt API keys
│   │   ├── webhookVerification.js   # NEW: Webhook signature validation
│   │   ├── xssSanitizer.js          # NEW: XSS protection
│   │   └── inputValidator.js        # NEW: Input validation helpers
│   └── config/
│       └── security.config.js       # NEW: Environment-specific config
├── middleware/
│   └── securityMiddleware.js        # NEW: Security headers, rate limits
└── utils/
    └── env.js                        # NEW: Environment helpers

supabase/
└── migrations/
    └── 020_api_key_encryption.sql   # NEW: Encrypted storage

scripts/
├── deploy-production.sh              # ENHANCED: Security checks
└── validate-security.js              # NEW: Pre-deployment validation

docs/
├── SECURITY_AUDIT_REPORT.md         # EXISTING: Full audit
├── SECURITY_IMPLEMENTATION_PLAN.md  # THIS FILE
└── DEPLOYMENT_SECURITY_GUIDE.md     # NEW: Production deployment guide
```

---

## Detailed Implementation

Each section below includes:
- ✅ Development version (relaxed)
- 🔒 Production version (hardened)
- 📁 Where to create the file
- 🎯 How to use it

---

## 1. Environment-Aware Logging System

### File: `src/lib/logger.js`

**Purpose**:
- Development: Full verbose logging for debugging
- Production: Minimal logging, no sensitive data

**Implementation**:

```javascript
/**
 * Environment-Aware Logger
 * Development: Full console logging
 * Production: Sanitized logging only
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Sensitive patterns to redact in production
const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /authorization/i,
  /card[_-]?number/i,
];

/**
 * Sanitize object by redacting sensitive fields
 */
const sanitize = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in sanitized) {
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitize(sanitized[key]);
    }
  }

  return sanitized;
};

/**
 * Logger with environment-aware behavior
 */
export const logger = {
  /**
   * Development: Full logging
   * Production: No logging
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Development: Full logging
   * Production: Sanitized logging
   */
  info: (...args) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    } else if (isProduction) {
      const sanitizedArgs = args.map(arg =>
        typeof arg === 'object' ? sanitize(arg) : arg
      );
      console.log('[INFO]', ...sanitizedArgs);
    }
  },

  /**
   * Development: Full logging
   * Production: Sanitized logging
   */
  warn: (...args) => {
    const sanitizedArgs = isProduction
      ? args.map(arg => typeof arg === 'object' ? sanitize(arg) : arg)
      : args;
    console.warn('[WARN]', ...sanitizedArgs);
  },

  /**
   * Always log errors (both environments)
   * Production: Sanitize sensitive data
   */
  error: (...args) => {
    const sanitizedArgs = isProduction
      ? args.map(arg => typeof arg === 'object' ? sanitize(arg) : arg)
      : args;
    console.error('[ERROR]', ...sanitizedArgs);
  },

  /**
   * Payment-specific logging with extra sanitization
   */
  payment: (message, data) => {
    if (isDevelopment) {
      console.log('[PAYMENT]', message, data);
    } else {
      // In production, only log transaction reference and status
      const safeData = {
        merchantReference: data?.merchantReference,
        status: data?.status,
        timestamp: new Date().toISOString(),
      };
      console.log('[PAYMENT]', message, safeData);
    }
  },
};

export default logger;
```

### Usage Example:

```javascript
// In paymentGatewayService.js
import logger from '@/lib/logger';

// Replace:
console.log('Payment Request:', requestPayload);

// With:
logger.debug('Payment Request:', requestPayload); // Only in dev
logger.payment('Payment initiated', { merchantReference, status }); // Sanitized in prod
```

---

## 2. API Key Encryption (Production Only)

### File: `src/lib/security/apiKeyEncryption.js`

**Purpose**:
- Development: Store API keys in plain text (easy testing)
- Production: Encrypt API keys using PostgreSQL pgcrypto

**Implementation**:

```javascript
/**
 * API Key Encryption Service
 * Development: Pass-through (no encryption)
 * Production: AES encryption using Supabase pgcrypto
 */

import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/logger';

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Encryption key should be stored as environment variable in production
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'dev-encryption-key';

/**
 * Encrypt API key
 * Development: Returns plain text
 * Production: Uses pgp_sym_encrypt
 */
export const encryptApiKey = async (apiKey) => {
  if (!apiKey) return null;

  // Development: No encryption
  if (isDevelopment) {
    logger.debug('API Key Encryption: SKIPPED (development mode)');
    return apiKey;
  }

  // Production: Use PostgreSQL encryption
  try {
    const { data, error } = await supabase.rpc('encrypt_api_key', {
      api_key: apiKey,
      encryption_key: ENCRYPTION_KEY,
    });

    if (error) throw error;

    logger.info('API Key encrypted successfully');
    return data;
  } catch (error) {
    logger.error('Failed to encrypt API key:', error);
    throw new Error('API key encryption failed');
  }
};

/**
 * Decrypt API key
 * Development: Returns plain text
 * Production: Uses pgp_sym_decrypt
 */
export const decryptApiKey = async (encryptedKey) => {
  if (!encryptedKey) return null;

  // Development: No decryption needed
  if (isDevelopment) {
    logger.debug('API Key Decryption: SKIPPED (development mode)');
    return encryptedKey;
  }

  // Production: Use PostgreSQL decryption
  try {
    const { data, error } = await supabase.rpc('decrypt_api_key', {
      encrypted_key: encryptedKey,
      encryption_key: ENCRYPTION_KEY,
    });

    if (error) throw error;

    logger.info('API Key decrypted successfully');
    return data;
  } catch (error) {
    logger.error('Failed to decrypt API key:', error);
    throw new Error('API key decryption failed');
  }
};

/**
 * Validate encryption key exists in production
 */
export const validateEncryptionSetup = () => {
  if (isProduction && (!ENCRYPTION_KEY || ENCRYPTION_KEY === 'dev-encryption-key')) {
    throw new Error(
      'CRITICAL: VITE_ENCRYPTION_KEY must be set in production environment'
    );
  }
  return true;
};
```

### Database Migration: `supabase/migrations/020_api_key_encryption.sql`

```sql
-- API Key Encryption Functions
-- Only active in production

-- Function to encrypt API key
CREATE OR REPLACE FUNCTION encrypt_api_key(
  api_key TEXT,
  encryption_key TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(pgp_sym_encrypt(api_key, encryption_key), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt API key
CREATE OR REPLACE FUNCTION decrypt_api_key(
  encrypted_key TEXT,
  encryption_key TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(decode(encrypted_key, 'base64'), encryption_key);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Decryption failed: Invalid key or corrupted data';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add encrypted column to payment_gateway_config
ALTER TABLE payment_gateway_config
ADD COLUMN IF NOT EXISTS api_key_encrypted TEXT;

-- Comment
COMMENT ON COLUMN payment_gateway_config.api_key_encrypted IS
'Encrypted API key using pgp_sym_encrypt (production only)';

-- Note: In development, we'll use config_json.apiKey
-- In production, we'll use api_key_encrypted
```

### Usage in `paymentGatewayService.js`:

```javascript
import { encryptApiKey, decryptApiKey } from '@/lib/security/apiKeyEncryption';

// When saving gateway config (admin settings)
export const updateGatewayConfig = async (gatewayName, updates) => {
  const updateData = {};

  if (updates.config?.apiKey) {
    // Encrypt in production, plain text in development
    updateData.api_key_encrypted = await encryptApiKey(updates.config.apiKey);

    // Remove from JSON config in production
    if (import.meta.env.PROD) {
      delete updates.config.apiKey;
    }
  }

  // ... rest of update logic
};

// When using API key
const getDecryptedApiKey = async (config) => {
  if (import.meta.env.DEV) {
    return config.config?.apiKey; // Plain text in dev
  } else {
    return await decryptApiKey(config.api_key_encrypted); // Encrypted in prod
  }
};
```

---

## 3. Rate Limiting (Production Only)

### File: `src/lib/rateLimiter.js`

**Purpose**:
- Development: No rate limiting (unlimited requests for testing)
- Production: Strict rate limiting to prevent abuse

**Installation**:
```bash
npm install rate-limiter-flexible
```

**Implementation**:

```javascript
/**
 * Rate Limiter
 * Development: Disabled (returns immediately)
 * Production: Enforces rate limits
 */

import { RateLimiterMemory } from 'rate-limiter-flexible';
import logger from '@/lib/logger';

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Rate limit configurations
const RATE_LIMITS = {
  // Payment operations: 10 per hour per user
  payment: {
    points: 10,
    duration: 3600, // 1 hour
  },

  // Bulk upload: 5 per hour per user
  bulkUpload: {
    points: 5,
    duration: 3600,
  },

  // API calls: 100 per minute per user
  api: {
    points: 100,
    duration: 60,
  },

  // Login attempts: 5 per 15 minutes per IP
  login: {
    points: 5,
    duration: 900, // 15 minutes
  },
};

// Create rate limiters for production
const rateLimiters = isProduction
  ? {
      payment: new RateLimiterMemory(RATE_LIMITS.payment),
      bulkUpload: new RateLimiterMemory(RATE_LIMITS.bulkUpload),
      api: new RateLimiterMemory(RATE_LIMITS.api),
      login: new RateLimiterMemory(RATE_LIMITS.login),
    }
  : null;

/**
 * Check rate limit for an operation
 * Development: Always allows
 * Production: Enforces limits
 */
export const checkRateLimit = async (type, identifier) => {
  // Development: Skip rate limiting
  if (isDevelopment) {
    logger.debug(`Rate limit check SKIPPED (${type}) for: ${identifier}`);
    return { allowed: true };
  }

  // Production: Enforce rate limiting
  try {
    const limiter = rateLimiters[type];

    if (!limiter) {
      logger.warn(`Unknown rate limit type: ${type}`);
      return { allowed: true }; // Allow if limiter not configured
    }

    await limiter.consume(identifier);

    logger.info(`Rate limit OK (${type}) for: ${identifier}`);
    return { allowed: true };

  } catch (rejRes) {
    const retryAfter = Math.round(rejRes.msBeforeNext / 1000) || 1;

    logger.warn(`Rate limit EXCEEDED (${type}) for: ${identifier}`, {
      retryAfter,
      remainingPoints: rejRes.remainingPoints,
    });

    return {
      allowed: false,
      retryAfter,
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
    };
  }
};

/**
 * Middleware-style rate limiter
 */
export const rateLimitMiddleware = (type) => {
  return async (identifier) => {
    const result = await checkRateLimit(type, identifier);

    if (!result.allowed) {
      throw new Error(result.message);
    }

    return true;
  };
};

export default {
  checkRateLimit,
  rateLimitMiddleware,
  RATE_LIMITS,
};
```

### Usage Example:

```javascript
// In paymentGatewayService.js
import { checkRateLimit } from '@/lib/rateLimiter';

export const initiateKinaBankPayment = async (paymentData, userId) => {
  // Check rate limit (only in production)
  const rateLimit = await checkRateLimit('payment', userId);

  if (!rateLimit.allowed) {
    throw new Error(rateLimit.message);
  }

  // Continue with payment...
};

// In bulkUploadService.js
import { checkRateLimit } from '@/lib/rateLimiter';

export async function uploadBulkPassports(file) {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const rateLimit = await checkRateLimit('bulkUpload', userId);

  if (!rateLimit.allowed) {
    throw new Error(rateLimit.message);
  }

  // Continue with upload...
}
```

---

## 4. XSS Sanitization for Email Templates

### File: `src/lib/security/xssSanitizer.js`

**Purpose**:
- Development: Optional sanitization (easier debugging)
- Production: Strict HTML sanitization

**Installation**:
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

**Implementation**:

```javascript
/**
 * XSS Sanitization
 * Development: Lenient (warnings only)
 * Production: Strict sanitization
 */

import DOMPurify from 'dompurify';
import logger from '@/lib/logger';

const isDevelopment = import.meta.env.DEV;

/**
 * Sanitize HTML content
 * Development: Warns but allows most HTML
 * Production: Strict sanitization
 */
export const sanitizeHTML = (html, options = {}) => {
  if (!html) return '';

  const config = isDevelopment
    ? {
        // Development: More permissive
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4',
          'ul', 'ol', 'li', 'a', 'img', 'table', 'tr', 'td', 'th',
          'div', 'span', 'blockquote', 'code', 'pre',
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style'],
        ALLOW_DATA_ATTR: false,
        ...options,
      }
    : {
        // Production: Restrictive
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3',
          'ul', 'ol', 'li', 'a', 'table', 'tr', 'td', 'th',
        ],
        ALLOWED_ATTR: ['href', 'alt', 'title'],
        ALLOW_DATA_ATTR: false,
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
        ...options,
      };

  const clean = DOMPurify.sanitize(html, config);

  // Log if content was modified
  if (clean !== html) {
    if (isDevelopment) {
      logger.warn('HTML content was sanitized (contains potentially unsafe elements)');
    } else {
      logger.info('HTML content sanitized');
    }
  }

  return clean;
};

/**
 * Sanitize plain text (prevent injection in text fields)
 */
export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return text;

  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate and sanitize email
 */
export const sanitizeEmail = (email) => {
  if (!email) return '';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    logger.warn('Invalid email format:', email);
    return '';
  }

  return email.toLowerCase().trim();
};

export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeEmail,
};
```

### Usage in EmailTemplates.jsx:

```javascript
import { sanitizeHTML } from '@/lib/security/xssSanitizer';

// When previewing email template
const EmailPreview = ({ template }) => {
  const cleanHTML = sanitizeHTML(template.body);

  return (
    <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />
  );
};

// When saving template
const handleSaveTemplate = async () => {
  const sanitized = {
    ...template,
    subject: sanitizeText(template.subject),
    body: sanitizeHTML(template.body),
  };

  await saveTemplate(sanitized);
};
```

---

## 5. Webhook Signature Verification (Production Only)

### File: `src/lib/security/webhookVerification.js`

**Purpose**:
- Development: Skip verification (easier testing)
- Production: Verify webhook signatures from Kina Bank

**Implementation**:

```javascript
/**
 * Webhook Signature Verification
 * Development: Skipped (accepts all webhooks)
 * Production: Verifies HMAC signatures
 */

import crypto from 'crypto';
import logger from '@/lib/logger';

const isDevelopment = import.meta.env.DEV;

// Webhook secret from Kina Bank (environment variable)
const WEBHOOK_SECRET = import.meta.env.VITE_KINA_BANK_WEBHOOK_SECRET || '';

/**
 * Verify Kina Bank webhook signature
 * Development: Always returns true
 * Production: Verifies HMAC-SHA256 signature
 */
export const verifyKinaBankWebhook = (payload, signature, timestamp) => {
  // Development: Skip verification
  if (isDevelopment) {
    logger.debug('Webhook verification SKIPPED (development mode)');
    return true;
  }

  // Production: Verify signature
  if (!WEBHOOK_SECRET) {
    logger.error('Webhook secret not configured');
    return false;
  }

  if (!signature) {
    logger.warn('Webhook signature missing');
    return false;
  }

  try {
    // Create expected signature
    const payloadString = JSON.stringify(payload);
    const signaturePayload = `${timestamp}.${payloadString}`;

    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(signaturePayload)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      logger.warn('Webhook signature verification failed');
    } else {
      logger.info('Webhook signature verified successfully');
    }

    return isValid;

  } catch (error) {
    logger.error('Webhook verification error:', error);
    return false;
  }
};

/**
 * Verify webhook timestamp (prevent replay attacks)
 * Development: Skipped
 * Production: Reject webhooks older than 5 minutes
 */
export const verifyWebhookTimestamp = (timestamp) => {
  // Development: Skip check
  if (isDevelopment) {
    return true;
  }

  // Production: Check timestamp
  const now = Math.floor(Date.now() / 1000);
  const difference = Math.abs(now - timestamp);

  const MAX_AGE = 5 * 60; // 5 minutes

  if (difference > MAX_AGE) {
    logger.warn('Webhook timestamp too old:', { timestamp, difference });
    return false;
  }

  return true;
};

export default {
  verifyKinaBankWebhook,
  verifyWebhookTimestamp,
};
```

### Usage in paymentGatewayService.js:

```javascript
import { verifyKinaBankWebhook, verifyWebhookTimestamp } from '@/lib/security/webhookVerification';

export const handleKinaBankWebhook = async (webhookData, headers) => {
  const signature = headers['x-kina-signature'];
  const timestamp = headers['x-kina-timestamp'];

  // Verify signature (only in production)
  if (!verifyKinaBankWebhook(webhookData, signature, timestamp)) {
    throw new Error('Invalid webhook signature');
  }

  // Verify timestamp (prevent replay attacks)
  if (!verifyWebhookTimestamp(parseInt(timestamp))) {
    throw new Error('Webhook timestamp invalid or too old');
  }

  // Process webhook...
};
```

---

## 6. Security Headers (Production Only)

### File: `public/_headers` (for static hosting)

```
# Production Security Headers
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://api.kinabank.com.pg; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.kinabank.com.pg https://*.supabase.co; frame-src https://api.kinabank.com.pg;
```

### Nginx Configuration: `nginx.production.conf`

```nginx
# Production Security Headers
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://api.kinabank.com.pg; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.kinabank.com.pg https://*.supabase.co; frame-src https://api.kinabank.com.pg;" always;

    # HSTS (force HTTPS)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Serve React app
    root /var/www/png-green-fees/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Additional security
    server_tokens off; # Hide nginx version
    client_max_body_size 10M; # Limit upload size
}

# Development server (no security headers needed)
server {
    listen 3000;
    server_name localhost;

    root /var/www/png-green-fees/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 7. Environment Configuration

### File: `src/lib/config/security.config.js`

```javascript
/**
 * Security Configuration
 * Environment-specific security settings
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

export const securityConfig = {
  // Logging
  logging: {
    enabled: true,
    level: isDevelopment ? 'debug' : 'error',
    sanitize: isProduction,
  },

  // Rate Limiting
  rateLimiting: {
    enabled: isProduction,
    payment: { points: 10, duration: 3600 },
    bulkUpload: { points: 5, duration: 3600 },
    api: { points: 100, duration: 60 },
    login: { points: 5, duration: 900 },
  },

  // Encryption
  encryption: {
    enabled: isProduction,
    algorithm: 'aes-256-gcm',
    requireKey: isProduction,
  },

  // Webhook Verification
  webhooks: {
    verifySignature: isProduction,
    verifyTimestamp: isProduction,
    maxAge: 300, // 5 minutes
  },

  // XSS Protection
  xss: {
    sanitizeHTML: true,
    strictMode: isProduction,
  },

  // CORS
  cors: {
    enabled: true,
    origins: isDevelopment
      ? ['http://localhost:3000', 'http://localhost:5173']
      : ['https://your-domain.com'],
  },

  // Session
  session: {
    timeout: 3600, // 1 hour
    refreshThreshold: 300, // 5 minutes before expiry
  },

  // File Upload
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
    scanForMalware: isProduction,
  },
};

export default securityConfig;
```

---

## 8. Production Build Script with Security Validation

### File: `scripts/validate-security.js`

```javascript
/**
 * Pre-Deployment Security Validation
 * Runs before production build to ensure security requirements are met
 */

import fs from 'fs';
import path from 'path';

const errors = [];
const warnings = [];

console.log('🔒 Running Security Validation for Production Build...\n');

// 1. Check environment variables
console.log('✓ Checking environment variables...');
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_ENCRYPTION_KEY',
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName] || process.env[varName].includes('your_')) {
    errors.push(`Missing or invalid environment variable: ${varName}`);
  }
});

// 2. Check for development-only code
console.log('✓ Checking for development code...');
const srcFiles = getAllJsFiles('src');
srcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');

  // Check for console.log (should use logger)
  const consoleLogCount = (content.match(/console\.log/g) || []).length;
  if (consoleLogCount > 0) {
    warnings.push(`${file} contains ${consoleLogCount} console.log statements`);
  }

  // Check for TODO/FIXME comments
  if (content.includes('TODO') || content.includes('FIXME')) {
    warnings.push(`${file} contains TODO/FIXME comments`);
  }
});

// 3. Check for .env file in git
console.log('✓ Checking .env file status...');
if (fs.existsSync('.env')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf-8');
  if (!gitignore.includes('.env')) {
    errors.push('.env file exists but not in .gitignore');
  }
}

// 4. Check npm audit
console.log('✓ Running npm audit...');
const { execSync } = require('child_process');
try {
  execSync('npm audit --production --audit-level=high', { stdio: 'inherit' });
} catch (error) {
  warnings.push('npm audit found vulnerabilities');
}

// 5. Verify security files exist
console.log('✓ Verifying security implementation files...');
const requiredFiles = [
  'src/lib/logger.js',
  'src/lib/rateLimiter.js',
  'src/lib/security/apiKeyEncryption.js',
  'src/lib/security/webhookVerification.js',
  'src/lib/security/xssSanitizer.js',
];

requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    errors.push(`Required security file missing: ${file}`);
  }
});

// 6. Check for hardcoded secrets
console.log('✓ Scanning for hardcoded secrets...');
const secretPatterns = [
  /sk_live_[a-zA-Z0-9]{32}/,
  /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
  /password\s*[:=]\s*['"][^'"]+['"]/i,
];

srcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  secretPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      errors.push(`Possible hardcoded secret in ${file}`);
    }
  });
});

// Report results
console.log('\n' + '='.repeat(60));
console.log('📊 Security Validation Results');
console.log('='.repeat(60) + '\n');

if (errors.length > 0) {
  console.log('❌ ERRORS (must fix):');
  errors.forEach(err => console.log(`  - ${err}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS (recommended to fix):');
  warnings.forEach(warn => console.log(`  - ${warn}`));
  console.log('');
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All security checks passed!');
  console.log('');
}

// Exit with error if critical issues found
if (errors.length > 0) {
  console.log('🚫 Production build blocked due to security issues.');
  console.log('Please fix the errors above and try again.\n');
  process.exit(1);
} else {
  console.log('✅ Security validation passed. Safe to deploy.\n');
  process.exit(0);
}

// Helper function
function getAllJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist')) {
        getAllJsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}
```

### Update package.json:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:production": "node scripts/validate-security.js && vite build --mode production",
    "preview": "vite preview",
    "validate": "node scripts/validate-security.js"
  }
}
```

---

## 9. Environment Files

### `.env.development` (for localhost testing)

```bash
# Development Environment (Relaxed Security)
NODE_ENV=development
VITE_ENV=development

# Supabase (use test project)
VITE_SUPABASE_URL=https://your-test-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_test_anon_key

# Payment Gateway (sandbox)
VITE_KINA_BANK_MERCHANT_ID=test_merchant
VITE_KINA_BANK_API_ENDPOINT=https://sandbox.kinabank.com.pg/api
VITE_KINA_BANK_SANDBOX_MODE=true

# Security (development - not critical)
VITE_ENCRYPTION_KEY=dev-encryption-key-not-used
VITE_KINA_BANK_WEBHOOK_SECRET=dev-webhook-secret

# Features (all enabled for testing)
VITE_ENABLE_RATE_LIMITING=false
VITE_ENABLE_API_ENCRYPTION=false
VITE_ENABLE_WEBHOOK_VERIFICATION=false
```

### `.env.production` (for live server)

```bash
# Production Environment (Hardened Security)
NODE_ENV=production
VITE_ENV=production

# Supabase (production project)
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# Payment Gateway (live)
VITE_KINA_BANK_MERCHANT_ID=your_actual_merchant_id
VITE_KINA_BANK_API_ENDPOINT=https://api.kinabank.com.pg/payment
VITE_KINA_BANK_SANDBOX_MODE=false

# Security (production - CRITICAL)
VITE_ENCRYPTION_KEY=your-strong-random-256-bit-key-here
VITE_KINA_BANK_WEBHOOK_SECRET=your-webhook-secret-from-kina-bank

# Features (all enabled for security)
VITE_ENABLE_RATE_LIMITING=true
VITE_ENABLE_API_ENCRYPTION=true
VITE_ENABLE_WEBHOOK_VERIFICATION=true
```

---

## 10. Deployment Scripts

### `scripts/deploy-production.sh`

```bash
#!/bin/bash

# Production Deployment Script with Security Checks
# Usage: ./scripts/deploy-production.sh

set -e  # Exit on error

echo "🚀 PNG Green Fees - Production Deployment"
echo "=========================================="
echo ""

# 1. Environment check
echo "1️⃣  Checking environment..."
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    exit 1
fi

source .env.production

if [ "$VITE_ENV" != "production" ]; then
    echo "❌ Not configured for production environment!"
    exit 1
fi

echo "✅ Environment: Production"
echo ""

# 2. Security validation
echo "2️⃣  Running security validation..."
npm run validate

if [ $? -ne 0 ]; then
    echo "❌ Security validation failed!"
    exit 1
fi

echo "✅ Security validation passed"
echo ""

# 3. Dependencies check
echo "3️⃣  Checking dependencies..."
npm audit --production --audit-level=high

if [ $? -ne 0 ]; then
    echo "⚠️  Found high/critical vulnerabilities!"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Dependencies checked"
echo ""

# 4. Build application
echo "4️⃣  Building application..."
npm run build:production

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful"
echo ""

# 5. Create deployment package
echo "5️⃣  Creating deployment package..."
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DEPLOY_DIR="deployments"
DEPLOY_NAME="png-green-fees-production-${TIMESTAMP}"
DEPLOY_PATH="${DEPLOY_DIR}/${DEPLOY_NAME}"

mkdir -p $DEPLOY_DIR
mkdir -p $DEPLOY_PATH

# Copy build files
cp -r dist/* $DEPLOY_PATH/
cp .env.production $DEPLOY_PATH/.env
cp nginx.production.conf $DEPLOY_PATH/nginx.conf

# Create deployment manifest
cat > $DEPLOY_PATH/MANIFEST.txt << EOF
PNG Green Fees - Production Deployment
======================================
Timestamp: ${TIMESTAMP}
Version: $(git rev-parse --short HEAD)
Environment: Production
Security: Hardened

Files:
- dist/ (built application)
- .env (production config)
- nginx.conf (security headers)

Deployment Checklist:
☐ Verify HTTPS is enabled
☐ Configure nginx with security headers
☐ Set up environment variables
☐ Run database migrations
☐ Test payment gateway in production
☐ Monitor logs for 24 hours
EOF

echo "✅ Deployment package created: $DEPLOY_PATH"
echo ""

# 6. Create tarball
echo "6️⃣  Creating tarball..."
cd $DEPLOY_DIR
tar -czf "${DEPLOY_NAME}.tar.gz" $DEPLOY_NAME
cd ..

echo "✅ Tarball created: ${DEPLOY_DIR}/${DEPLOY_NAME}.tar.gz"
echo ""

# 7. Final instructions
echo "=========================================="
echo "✅ Production build complete!"
echo "=========================================="
echo ""
echo "📦 Deployment package: ${DEPLOY_DIR}/${DEPLOY_NAME}.tar.gz"
echo ""
echo "Next steps:"
echo "1. Transfer tarball to production server"
echo "2. Extract: tar -xzf ${DEPLOY_NAME}.tar.gz"
echo "3. Copy files to /var/www/png-green-fees/"
echo "4. Restart nginx: sudo systemctl restart nginx"
echo "5. Monitor logs: tail -f /var/log/nginx/error.log"
echo ""
echo "🔒 Security Features Enabled:"
echo "   ✓ API key encryption"
echo "   ✓ Rate limiting"
echo "   ✓ Webhook verification"
echo "   ✓ XSS sanitization"
echo "   ✓ Security headers"
echo "   ✓ Minimal logging"
echo ""
```

### Make scripts executable:

```bash
chmod +x scripts/deploy-production.sh
chmod +x scripts/validate-security.js
```

---

## Implementation Checklist

### Phase 1: Critical Security (Before Production) 🔴

- [ ] Create `src/lib/logger.js` (environment-aware logging)
- [ ] Create `src/lib/security/apiKeyEncryption.js` (encrypt API keys)
- [ ] Create `supabase/migrations/020_api_key_encryption.sql`
- [ ] Update `paymentGatewayService.js` to use encrypted keys
- [ ] Replace all `console.log` with `logger.*`
- [ ] Test encryption in development (should skip)
- [ ] Test encryption in production build
- [ ] Generate strong `VITE_ENCRYPTION_KEY` for production
- [ ] Document encryption key backup procedure

### Phase 2: High Priority Security 🟠

- [ ] Install `npm install rate-limiter-flexible`
- [ ] Create `src/lib/rateLimiter.js`
- [ ] Add rate limiting to payment operations
- [ ] Add rate limiting to bulk upload
- [ ] Test rate limits in production mode
- [ ] Install `npm install dompurify`
- [ ] Create `src/lib/security/xssSanitizer.js`
- [ ] Update `EmailTemplates.jsx` to sanitize HTML
- [ ] Create `src/lib/security/webhookVerification.js`
- [ ] Update webhook handler with signature verification
- [ ] Get webhook secret from Kina Bank
- [ ] Create `nginx.production.conf` with security headers
- [ ] Test security headers in production

### Phase 3: Deployment Automation

- [ ] Create `scripts/validate-security.js`
- [ ] Test validation script
- [ ] Create `scripts/deploy-production.sh`
- [ ] Update `package.json` scripts
- [ ] Create `.env.development`
- [ ] Create `.env.production`
- [ ] Test development build (relaxed security)
- [ ] Test production build (hardened security)
- [ ] Document deployment process

### Phase 4: Testing & Verification

- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Test all security features in development
- [ ] Test all security features in production build
- [ ] Verify rate limiting works
- [ ] Verify API key encryption works
- [ ] Verify XSS sanitization works
- [ ] Verify logging is sanitized in production
- [ ] Verify webhook verification works (once Kina Bank provides secret)
- [ ] Load test rate limiters
- [ ] Penetration testing (optional but recommended)

---

## Usage Guide

### For Development (Localhost):

```bash
# Use development environment
npm run dev

# Features:
# ✓ Full console logging for debugging
# ✓ No rate limiting (unlimited requests)
# ✓ No API key encryption (plain text)
# ✓ No webhook verification (accepts all)
# ✓ Lenient XSS sanitization
```

### For Production Deployment:

```bash
# Run security validation
npm run validate

# Build for production
npm run build:production

# Deploy to server
./scripts/deploy-production.sh

# Features:
# ✓ Minimal sanitized logging only
# ✓ Strict rate limiting
# ✓ Encrypted API keys
# ✓ Webhook signature verification
# ✓ Strict XSS sanitization
# ✓ Security headers enabled
```

---

## Summary

This implementation plan provides:

1. **✅ Dual Environment Support**
   - Development: Relaxed (easy debugging)
   - Production: Hardened (maximum security)

2. **✅ Critical Security Fixes**
   - API key encryption
   - Production logging sanitization
   - Rate limiting
   - Webhook verification
   - XSS protection

3. **✅ Automated Validation**
   - Pre-deployment security checks
   - Dependency vulnerability scanning
   - Hardcoded secret detection

4. **✅ Easy Deployment**
   - One-command production build
   - Automated packaging
   - Clear deployment instructions

5. **✅ Clear Separation**
   - Development stays fast and debuggable
   - Production is locked down and secure

All security improvements are **environment-aware** and will automatically activate in production while staying relaxed in development.

---

## Next Steps

1. Review this plan with your team
2. Begin Phase 1 implementation (critical security)
3. Test in development environment
4. Deploy to staging for testing
5. Deploy to production with hardened security

For questions or clarifications, refer to SECURITY_AUDIT_REPORT.md for detailed vulnerability information.
