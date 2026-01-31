/**
 * Standard API Response Utilities
 *
 * Provides consistent response formatting across all GreenPay API endpoints.
 * All endpoints should use these utilities instead of directly calling res.json()
 *
 * @module apiResponse
 */

/**
 * Send a standardized success response
 *
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code (200, 201, etc.)
 * @param {string} message - Human-readable success message
 * @param {any} data - Response payload (will be wrapped in "data" key)
 * @returns {object} Express response
 *
 * @example
 * success(res, 201, '3 voucher(s) created successfully', {
 *   batchId: 'BATCH-123',
 *   vouchers: [...]
 * });
 *
 * // Client receives:
 * {
 *   "type": "success",
 *   "status": "success",
 *   "message": "3 voucher(s) created successfully",
 *   "data": {
 *     "batchId": "BATCH-123",
 *     "vouchers": [...]
 *   }
 * }
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
 * Send a standardized error response
 *
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code (400, 404, 500, etc.)
 * @param {string} message - Human-readable error message
 * @param {object} errorDetails - Optional error details object
 * @param {string} errorDetails.code - Machine-readable error code
 * @param {object} errorDetails.details - Additional error context
 * @returns {object} Express response
 *
 * @example
 * error(res, 400, 'Validation failed', {
 *   code: 'VALIDATION_ERROR',
 *   details: {
 *     field: 'quantity',
 *     reason: 'must be between 1 and 5'
 *   }
 * });
 *
 * // Client receives:
 * {
 *   "type": "error",
 *   "status": "error",
 *   "message": "Validation failed",
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "details": {
 *       "field": "quantity",
 *       "reason": "must be between 1 and 5"
 *     }
 *   }
 * }
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

/**
 * Send a validation error response (400 Bad Request)
 * Shortcut for common validation errors
 *
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {string} field - Field that failed validation
 * @param {string} reason - Why validation failed
 * @returns {object} Express response
 *
 * @example
 * validationError(res, 'Invalid quantity', 'quantity', 'must be between 1 and 5');
 */
const validationError = (res, message, field, reason) => {
  return error(res, 400, message, {
    code: 'VALIDATION_ERROR',
    details: { field, reason }
  });
};

/**
 * Send a not found error response (404 Not Found)
 * Shortcut for common not found errors
 *
 * @param {object} res - Express response object
 * @param {string} resource - Resource type (e.g., 'quotation', 'voucher')
 * @param {string|number} id - Resource identifier
 * @returns {object} Express response
 *
 * @example
 * notFoundError(res, 'quotation', '123');
 */
const notFoundError = (res, resource, id) => {
  return error(res, 404, `${resource} not found`, {
    code: 'NOT_FOUND',
    details: { resource, id }
  });
};

/**
 * Send an unauthorized error response (401 Unauthorized)
 *
 * @param {object} res - Express response object
 * @param {string} message - Optional custom message
 * @returns {object} Express response
 */
const unauthorizedError = (res, message = 'Authentication required') => {
  return error(res, 401, message, {
    code: 'UNAUTHORIZED'
  });
};

/**
 * Send a forbidden error response (403 Forbidden)
 *
 * @param {object} res - Express response object
 * @param {string} message - Optional custom message
 * @returns {object} Express response
 */
const forbiddenError = (res, message = 'Insufficient permissions') => {
  return error(res, 403, message, {
    code: 'FORBIDDEN'
  });
};

/**
 * Send an internal server error response (500 Internal Server Error)
 *
 * @param {object} res - Express response object
 * @param {Error} err - Error object (will NOT be sent to client in production)
 * @param {string} userMessage - Optional user-friendly message
 * @returns {object} Express response
 */
const serverError = (res, err, userMessage = 'An error occurred while processing your request') => {
  // Always log full error details server-side
  console.error('Internal Server Error:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  // In production: only send generic user-friendly message
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      type: 'error',
      status: 'error',
      error: userMessage
    });
  }

  // In development: include detailed error for debugging
  return res.status(500).json({
    type: 'error',
    status: 'error',
    error: userMessage,
    details: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message,
      stack: err.stack
    }
  });
};

module.exports = {
  success,
  error,
  validationError,
  notFoundError,
  unauthorizedError,
  forbiddenError,
  serverError
};
