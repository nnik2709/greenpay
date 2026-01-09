/**
 * Centralized Error Handling Middleware
 *
 * Provides consistent error responses across the application
 */

/**
 * Custom Application Error Class
 *
 * Extends the base Error class to include statusCode and errorCode
 *
 * @class AppError
 * @extends {Error}
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {string} errorCode - Machine-readable error code (default: 'INTERNAL_ERROR')
   */
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true; // Distinguishes from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error codes for consistent API responses
 */
const ErrorCodes = {
  // Authentication & Authorization (401, 403)
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation Errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resource Errors (404, 409)
  NOT_FOUND: 'NOT_FOUND',
  VOUCHER_NOT_FOUND: 'VOUCHER_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVOICE_NOT_FOUND: 'INVOICE_NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Business Logic Errors (400, 422)
  INVALID_OPERATION: 'INVALID_OPERATION',
  VOUCHER_ALREADY_USED: 'VOUCHER_ALREADY_USED',
  VOUCHER_EXPIRED: 'VOUCHER_EXPIRED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server Errors (500, 503)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};

/**
 * Central Error Handler Middleware
 *
 * This should be the last middleware in your Express app
 *
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Default to 500 if statusCode not set
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || ErrorCodes.INTERNAL_ERROR;

  // Log error details (but not in production for sensitive data)
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    console.error('❌ Error Handler:', {
      message: err.message,
      statusCode,
      errorCode,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
  } else {
    // In production, only log essential info
    console.error(`❌ ${errorCode}: ${err.message} [${req.method} ${req.path}]`);
  }

  // Prepare error response
  const errorResponse = {
    error: err.message || 'An error occurred',
    code: errorCode,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // Include stack trace in development
  if (!isProduction && err.stack) {
    errorResponse.stack = err.stack.split('\n').map(line => line.trim());
  }

  // Include validation errors if present (from express-validator)
  if (err.errors && Array.isArray(err.errors)) {
    errorResponse.validationErrors = err.errors;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found Handler
 *
 * Catches all requests that don't match any routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.path}`,
    404,
    ErrorCodes.NOT_FOUND
  );
  next(error);
};

/**
 * Async Error Wrapper
 *
 * Wraps async route handlers to catch errors automatically
 *
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 *
 * @example
 * router.get('/vouchers', asyncHandler(async (req, res) => {
 *   const vouchers = await getVouchers();
 *   res.json(vouchers);
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Database Error Handler
 *
 * Converts database errors into AppError instances
 *
 * @param {Error} err - Database error
 * @returns {AppError} Formatted app error
 */
const handleDatabaseError = (err) => {
  // PostgreSQL error codes
  switch (err.code) {
    case '23505': // Unique violation
      return new AppError(
        'A record with this value already exists',
        409,
        ErrorCodes.DUPLICATE_ENTRY
      );

    case '23503': // Foreign key violation
      return new AppError(
        'Referenced record does not exist',
        400,
        ErrorCodes.INVALID_OPERATION
      );

    case '22P02': // Invalid text representation
      return new AppError(
        'Invalid data format provided',
        400,
        ErrorCodes.INVALID_INPUT
      );

    case '23502': // Not null violation
      return new AppError(
        'Required field is missing',
        400,
        ErrorCodes.MISSING_REQUIRED_FIELD
      );

    default:
      return new AppError(
        'Database operation failed',
        500,
        ErrorCodes.DATABASE_ERROR
      );
  }
};

module.exports = {
  AppError,
  ErrorCodes,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  handleDatabaseError
};
