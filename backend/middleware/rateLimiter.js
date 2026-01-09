const rateLimit = require('express-rate-limit');

/**
 * RATE LIMITING & BOT PROTECTION
 *
 * Protects public endpoints from:
 * - Brute force attacks
 * - Voucher code enumeration
 * - DDoS attacks
 * - Automated scraping
 */

/**
 * Strict rate limit for voucher validation
 * Prevents hackers from trying many voucher codes
 *
 * Limits: 40 requests per 15 minutes per IP (doubled for testing)
 */
const voucherValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40, // Limit each IP to 40 requests per window
  message: {
    error: 'Too many validation attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`⚠️  Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the maximum number of validation attempts. Please try again later.',
      retryAfter: 900
    });
  }
});

/**
 * Rate limit for voucher registration
 * Limits: 20 registrations per hour per IP (doubled for testing)
 */
const voucherRegistrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`⚠️  Registration rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many registration attempts',
      message: 'You have exceeded the maximum number of registrations allowed. Please try again in 1 hour.',
      retryAfter: 3600
    });
  }
});

/**
 * Strict rate limit for voucher lookup
 * Limits: 30 lookups per 10 minutes per IP (doubled for testing)
 */
const voucherLookupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`⚠️  Voucher lookup rate limit for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many lookup attempts',
      message: 'Please wait before trying again.',
      retryAfter: 600
    });
  }
});

/**
 * Strict rate limit for authentication endpoints
 * Prevents brute force attacks on login/register
 *
 * Limits: 10 attempts per 5 minutes per IP (reduced for faster recovery)
 */
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (reduced from 15 for faster recovery)
  max: 10, // Limit each IP to 10 login attempts per window
  message: {
    error: 'Too many authentication attempts. Please try again in 5 minutes.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`🔒 AUTH RATE LIMIT: IP ${req.ip} exceeded login attempts on ${req.path}`);
    res.status(429).json({
      error: 'Too many attempts',
      message: 'Too many authentication attempts from this IP. Please try again in 5 minutes.',
      retryAfter: 300
    });
  }
});

/**
 * General API rate limiter
 * Protects all API endpoints from DoS attacks
 *
 * Limits: 200 requests per minute per IP (doubled for testing)
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // Limit each IP to 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`⚠️  API rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please slow down your requests.',
      retryAfter: 60
    });
  }
});

/**
 * Additional security: Block suspicious patterns
 */
const suspiciousActivityDetector = (req, res, next) => {
  const suspiciousPatterns = [
    /(\bOR\b.*=.*|UNION.*SELECT|DROP.*TABLE|INSERT.*INTO)/i,
    /<script|javascript:|onerror=/i,
    /\.\.\//,
    /[;&|`$]/
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => checkValue(v));
    }
    return false;
  };

  const isSuspicious =
    checkValue(req.query) ||
    checkValue(req.body) ||
    checkValue(req.params);

  if (isSuspicious) {
    console.error(`🚨 SECURITY ALERT: Suspicious activity from IP: ${req.ip}, Path: ${req.path}`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Suspicious activity detected'
    });
  }

  next();
};

module.exports = {
  authLimiter,
  apiLimiter,
  voucherValidationLimiter,
  voucherRegistrationLimiter,
  voucherLookupLimiter,
  suspiciousActivityDetector
};
