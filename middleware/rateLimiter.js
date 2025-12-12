const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

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
 * Limits: 20 requests per 15 minutes per IP
 */
const voucherValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per window
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
 * Limits: 10 registrations per hour per IP
 */
const voucherRegistrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
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
 * Limits: 15 lookups per 10 minutes per IP
 */
const voucherLookupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
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
  voucherValidationLimiter,
  voucherRegistrationLimiter,
  voucherLookupLimiter,
  suspiciousActivityDetector
};
