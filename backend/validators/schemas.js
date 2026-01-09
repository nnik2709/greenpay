const { body, param, query } = require('express-validator');

/**
 * COMPREHENSIVE INPUT VALIDATION SCHEMAS
 *
 * Defense against:
 * - SQL injection
 * - XSS attacks
 * - Command injection
 * - Path traversal
 * - Invalid data types
 * - Business logic attacks
 */

/**
 * Voucher Code Validation
 * Format: 8 alphanumeric characters (e.g., ABC12345)
 */
const voucherCodeSchema = [
  param('voucherCode')
    .trim()
    .matches(/^[A-Z0-9]{8}$/)
    .withMessage('Invalid voucher code format. Must be 8 alphanumeric characters.')
];

/**
 * Email Validation
 * Strict validation with length limits
 */
const emailSchema = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address required')
    .isLength({ max: 254 })
    .withMessage('Email address too long')
];

const recipientEmailSchema = [
  body('recipient_email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address required')
    .isLength({ max: 254 })
    .withMessage('Email address too long')
];

/**
 * Passport Number Validation
 * PNG passport format: Letters followed by numbers
 * Example: NB1234567
 */
const passportNumberSchema = [
  body('passportNumber')
    .trim()
    .matches(/^[A-Z]{1,3}[0-9]{5,9}$/)
    .withMessage('Invalid passport number format')
    .isLength({ min: 6, max: 12 })
    .withMessage('Passport number must be 6-12 characters')
];

/**
 * Amount/Currency Validation
 * Prevents: negative values, unrealistic amounts, precision attacks
 */
const amountSchema = [
  body('amount')
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Amount must be between 0.01 and 1,000,000')
    .toFloat()
];

const feeAmountSchema = [
  body('fee')
    .optional()
    .isFloat({ min: 0, max: 100000 })
    .withMessage('Fee must be between 0 and 100,000')
    .toFloat()
];

/**
 * Pagination Validation
 * Prevents resource exhaustion attacks
 */
const paginationSchema = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Page must be between 1 and 10,000')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];

/**
 * Date Range Validation
 * Prevents: date manipulation, unrealistic ranges
 */
const dateRangeSchema = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be valid ISO 8601 format')
    .toDate(),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be valid ISO 8601 format')
    .toDate()
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

/**
 * User ID Validation
 * PostgreSQL integer primary key
 */
const userIdSchema = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('Valid user ID required')
    .toInt()
];

/**
 * Name Validation
 * Prevents: XSS, SQL injection in names
 */
const nameSchema = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens and apostrophes')
];

/**
 * Phone Number Validation
 * PNG format: +675 followed by 7-8 digits
 */
const phoneNumberSchema = [
  body('phone')
    .trim()
    .matches(/^\+675[0-9]{7,8}$/)
    .withMessage('Invalid PNG phone number. Format: +675XXXXXXXX')
];

/**
 * Nationality Validation
 * 2-letter ISO country codes
 */
const nationalitySchema = [
  body('nationality')
    .trim()
    .isLength({ min: 2, max: 2 })
    .withMessage('Nationality must be 2-letter ISO code')
    .matches(/^[A-Z]{2}$/)
    .withMessage('Nationality must be uppercase ISO code (e.g., PG, AU)')
];

/**
 * Password Validation
 * Strong password requirements
 */
const passwordSchema = [
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase, one uppercase, and one number')
];

/**
 * Status Validation
 * Whitelisted status values
 */
const statusSchema = (allowedStatuses) => [
  body('status')
    .trim()
    .isIn(allowedStatuses)
    .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

/**
 * Role ID Validation
 */
const roleIdSchema = [
  body('roleId')
    .isInt({ min: 1, max: 10 })
    .withMessage('Valid role ID required (1-10)')
    .toInt()
];

/**
 * Boolean Validation
 */
const booleanSchema = (fieldName) => [
  body(fieldName)
    .optional()
    .isBoolean()
    .withMessage(`${fieldName} must be true or false`)
    .toBoolean()
];

/**
 * Batch ID Validation
 * UUID format for batch operations
 */
const batchIdSchema = [
  body('batch_id')
    .optional()
    .isUUID()
    .withMessage('Batch ID must be valid UUID format')
];

/**
 * Corporate Voucher Quantity Validation
 * Prevents bulk abuse
 */
const quantitySchema = [
  body('quantity')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Quantity must be between 1 and 1000')
    .toInt()
];

/**
 * Payment Mode Validation
 */
const paymentModeSchema = [
  body('payment_mode')
    .trim()
    .isIn(['cash', 'card', 'bank_transfer', 'mobile_money', 'check'])
    .withMessage('Invalid payment mode')
];

/**
 * Text Area Validation (notes, descriptions)
 * Prevents XSS and excessive content
 */
const textAreaSchema = (fieldName, maxLength = 1000) => [
  body(fieldName)
    .optional()
    .trim()
    .isLength({ max: maxLength })
    .withMessage(`${fieldName} must not exceed ${maxLength} characters`)
    .matches(/^[^<>{}]*$/)
    .withMessage(`${fieldName} contains invalid characters`)
];

module.exports = {
  voucherCodeSchema,
  emailSchema,
  recipientEmailSchema,
  passportNumberSchema,
  amountSchema,
  feeAmountSchema,
  paginationSchema,
  dateRangeSchema,
  userIdSchema,
  nameSchema,
  phoneNumberSchema,
  nationalitySchema,
  passwordSchema,
  statusSchema,
  roleIdSchema,
  booleanSchema,
  batchIdSchema,
  quantitySchema,
  paymentModeSchema,
  textAreaSchema
};
