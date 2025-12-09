/**
 * Rate Limiting Middleware for PNG Green Fees API
 *
 * Protects against:
 * - Brute force attacks on login
 * - API abuse
 * - DDoS attempts
 * - Credential stuffing
 *
 * Uses express-rate-limit with Redis store for distributed rate limiting
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Redis client for distributed rate limiting (optional)
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('❌ Redis connection failed after 10 retries');
          return new Error('Redis connection failed');
        }
        return retries * 100; // Exponential backoff
      }
    }
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.connect().catch(console.error);
}

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks on login
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many login attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  // Use Redis for distributed rate limiting if available
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:login:'
  }) : undefined,
  // Custom key generator (use IP + user agent for better accuracy)
  keyGenerator: (req) => {
    return `${req.ip}-${req.get('user-agent')}`;
  },
  // Handler for rate limit exceeded
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit exceeded for login: ${req.ip}`);
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Your account has been temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.',
      retryAfter: 900 // seconds
    });
  }
});

/**
 * Moderate rate limiter for password reset
 * Prevents abuse of password reset functionality
 */
const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    error: 'Too many password reset requests. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:reset:'
  }) : undefined,
  keyGenerator: (req) => {
    // Rate limit by email being reset
    return req.body.email || req.ip;
  }
});

/**
 * API rate limiter for general endpoints
 * Prevents API abuse and DDoS
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests. Please slow down.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:api:'
  }) : undefined,
  skip: (req) => {
    // Don't rate limit health checks
    return req.path === '/health';
  }
});

/**
 * Strict rate limiter for public purchase endpoints
 * Prevents abuse of payment functionality
 */
const publicPurchaseRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 purchases per hour per IP
  message: {
    error: 'Too many purchase attempts. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:purchase:'
  }) : undefined,
  keyGenerator: (req) => {
    // Rate limit by IP and email
    const email = req.body.customerEmail || req.body.email || '';
    return `${req.ip}-${email}`;
  },
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit exceeded for public purchase: ${req.ip}, email: ${req.body.customerEmail}`);
    res.status(429).json({
      error: 'Too many purchase attempts',
      message: 'You have exceeded the maximum number of purchase attempts. Please try again later or contact support.',
      retryAfter: 3600
    });
  }
});

/**
 * Very strict rate limiter for registration endpoints
 * Prevents spam account creation
 */
const registrationRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // 3 registrations per day per IP
  message: {
    error: 'Too many registration attempts. Please try again tomorrow.',
    retryAfter: '24 hours'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:register:'
  }) : undefined,
  skipSuccessfulRequests: false, // Count all attempts
  skipFailedRequests: false
});

/**
 * Moderate rate limiter for file uploads
 * Prevents abuse of bulk upload functionality
 */
const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    error: 'Too many file uploads. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:upload:'
  }) : undefined
});

/**
 * Custom rate limiter factory
 * Create custom rate limiters with specific settings
 *
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
function createRateLimiter(options) {
  const defaults = {
    standardHeaders: true,
    legacyHeaders: false,
    store: redisClient ? new RedisStore({
      client: redisClient,
      prefix: `rl:${options.name || 'custom'}:`
    }) : undefined
  };

  return rateLimit({ ...defaults, ...options });
}

/**
 * Dynamic rate limiting based on user role
 * Higher privileges = higher rate limits
 */
function roleBasedRateLimiter(req, res, next) {
  const userRole = req.user?.role || 'public';

  const limits = {
    'Flex_Admin': 1000,      // Very high limit for admins
    'Finance_Manager': 500,   // High limit for managers
    'Counter_Agent': 300,     // Moderate limit for agents
    'IT_Support': 500,        // High limit for IT
    'public': 50              // Low limit for unauthenticated
  };

  const limiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: limits[userRole] || 50,
    name: `role-${userRole}`
  });

  return limiter(req, res, next);
}

/**
 * Cleanup function for graceful shutdown
 */
async function cleanup() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    console.log('✅ Redis connection closed');
  }
}

module.exports = {
  loginRateLimiter,
  passwordResetRateLimiter,
  apiRateLimiter,
  publicPurchaseRateLimiter,
  registrationRateLimiter,
  uploadRateLimiter,
  roleBasedRateLimiter,
  createRateLimiter,
  cleanup
};
