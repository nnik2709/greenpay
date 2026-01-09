const db = require('../config/database');

/**
 * COMPREHENSIVE AUDIT LOGGING SERVICE
 *
 * Records all security-relevant events for:
 * - Compliance (audit trails)
 * - Forensics (incident investigation)
 * - Anomaly detection
 * - User activity monitoring
 */

/**
 * Event Types for Classification
 */
const EventTypes = {
  // Authentication Events
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',

  // Authorization Events
  ACCESS_DENIED: 'access_denied',
  PERMISSION_ESCALATION: 'permission_escalation',

  // Data Access Events
  VIEW_SENSITIVE_DATA: 'view_sensitive_data',
  EXPORT_DATA: 'export_data',
  BULK_DATA_ACCESS: 'bulk_data_access',

  // Data Modification Events
  CREATE_RECORD: 'create_record',
  UPDATE_RECORD: 'update_record',
  DELETE_RECORD: 'delete_record',

  // Financial Events
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  REFUND_ISSUED: 'refund_issued',
  VOUCHER_CREATED: 'voucher_created',
  VOUCHER_REDEEMED: 'voucher_redeemed',

  // Security Events
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  SQL_INJECTION_ATTEMPT: 'sql_injection_attempt',
  XSS_ATTEMPT: 'xss_attempt',

  // System Events
  CONFIG_CHANGE: 'config_change',
  USER_CREATED: 'user_created',
  USER_MODIFIED: 'user_modified',
  USER_DELETED: 'user_deleted',
  ROLE_CHANGED: 'role_changed'
};

/**
 * Severity Levels
 */
const Severity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Main audit logging function
 *
 * @param {Object} params
 * @param {string} params.eventType - Type of event (from EventTypes)
 * @param {string} params.severity - Severity level (from Severity)
 * @param {number|null} params.userId - User ID (null for anonymous/system events)
 * @param {string|null} params.userEmail - User email
 * @param {string} params.action - Human-readable action description
 * @param {string|null} params.resourceType - Type of resource affected (e.g., 'voucher', 'passport', 'user')
 * @param {string|null} params.resourceId - ID of affected resource
 * @param {Object|null} params.metadata - Additional context (JSON)
 * @param {Object} params.req - Express request object for IP, user agent
 * @param {boolean} params.success - Whether the action succeeded
 * @param {string|null} params.failureReason - Reason for failure (if applicable)
 */
async function logAuditEvent({
  eventType,
  severity = Severity.INFO,
  userId = null,
  userEmail = null,
  action,
  resourceType = null,
  resourceId = null,
  metadata = null,
  req,
  success = true,
  failureReason = null
}) {
  try {
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    await db.query(
      `INSERT INTO audit_logs (
        event_type, severity, user_id, user_email, action,
        resource_type, resource_id, metadata, ip_address,
        user_agent, success, failure_reason, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      [
        eventType,
        severity,
        userId,
        userEmail,
        action,
        resourceType,
        resourceId,
        metadata ? JSON.stringify(metadata) : null,
        ipAddress,
        userAgent,
        success,
        failureReason
      ]
    );

    // Log critical events to console immediately
    if (severity === Severity.CRITICAL || severity === Severity.ERROR) {
      console.error(`🚨 AUDIT [${severity.toUpperCase()}]: ${action}`, {
        eventType,
        userId,
        userEmail,
        ipAddress,
        success,
        failureReason
      });
    }
  } catch (error) {
    // Never fail the main operation if audit logging fails
    // But log the audit failure itself
    console.error('❌ Failed to write audit log:', error);
    console.error('Attempted audit event:', {
      eventType,
      action,
      userId,
      userEmail
    });
  }
}

/**
 * Convenience functions for common audit events
 */

async function logLogin(userId, userEmail, req, success, failureReason = null) {
  return logAuditEvent({
    eventType: success ? EventTypes.LOGIN_SUCCESS : EventTypes.LOGIN_FAILED,
    severity: success ? Severity.INFO : Severity.WARNING,
    userId,
    userEmail,
    action: success ? `User logged in: ${userEmail}` : `Failed login attempt: ${userEmail}`,
    req,
    success,
    failureReason
  });
}

async function logPasswordChange(userId, userEmail, req, success, failureReason = null) {
  return logAuditEvent({
    eventType: EventTypes.PASSWORD_CHANGE,
    severity: Severity.INFO,
    userId,
    userEmail,
    action: `Password changed for ${userEmail}`,
    req,
    success,
    failureReason
  });
}

async function logAccessDenied(userId, userEmail, resource, req, reason) {
  return logAuditEvent({
    eventType: EventTypes.ACCESS_DENIED,
    severity: Severity.WARNING,
    userId,
    userEmail,
    action: `Access denied to ${resource}`,
    resourceType: resource,
    req,
    success: false,
    failureReason: reason
  });
}

async function logSuspiciousActivity(userId, userEmail, req, details) {
  return logAuditEvent({
    eventType: EventTypes.SUSPICIOUS_ACTIVITY,
    severity: Severity.CRITICAL,
    userId,
    userEmail,
    action: 'Suspicious activity detected',
    metadata: details,
    req,
    success: false
  });
}

async function logRateLimitExceeded(userId, userEmail, req, endpoint) {
  return logAuditEvent({
    eventType: EventTypes.RATE_LIMIT_EXCEEDED,
    severity: Severity.WARNING,
    userId,
    userEmail,
    action: `Rate limit exceeded on ${endpoint}`,
    metadata: { endpoint },
    req,
    success: false,
    failureReason: 'Rate limit exceeded'
  });
}

async function logVoucherCreated(userId, userEmail, voucherCode, req, metadata = {}) {
  return logAuditEvent({
    eventType: EventTypes.VOUCHER_CREATED,
    severity: Severity.INFO,
    userId,
    userEmail,
    action: `Voucher created: ${voucherCode}`,
    resourceType: 'voucher',
    resourceId: voucherCode,
    metadata,
    req,
    success: true
  });
}

async function logVoucherRedeemed(userId, userEmail, voucherCode, req, metadata = {}) {
  return logAuditEvent({
    eventType: EventTypes.VOUCHER_REDEEMED,
    severity: Severity.INFO,
    userId,
    userEmail,
    action: `Voucher redeemed: ${voucherCode}`,
    resourceType: 'voucher',
    resourceId: voucherCode,
    metadata,
    req,
    success: true
  });
}

async function logUserCreated(adminId, adminEmail, newUserId, newUserEmail, req) {
  return logAuditEvent({
    eventType: EventTypes.USER_CREATED,
    severity: Severity.INFO,
    userId: adminId,
    userEmail: adminEmail,
    action: `User created: ${newUserEmail}`,
    resourceType: 'user',
    resourceId: newUserId?.toString(),
    req,
    success: true
  });
}

async function logUserModified(adminId, adminEmail, targetUserId, targetUserEmail, req, changes) {
  return logAuditEvent({
    eventType: EventTypes.USER_MODIFIED,
    severity: Severity.INFO,
    userId: adminId,
    userEmail: adminEmail,
    action: `User modified: ${targetUserEmail}`,
    resourceType: 'user',
    resourceId: targetUserId?.toString(),
    metadata: { changes },
    req,
    success: true
  });
}

async function logRoleChanged(adminId, adminEmail, targetUserId, targetUserEmail, req, oldRole, newRole) {
  return logAuditEvent({
    eventType: EventTypes.ROLE_CHANGED,
    severity: Severity.WARNING,
    userId: adminId,
    userEmail: adminEmail,
    action: `Role changed for ${targetUserEmail}: ${oldRole} → ${newRole}`,
    resourceType: 'user',
    resourceId: targetUserId?.toString(),
    metadata: { oldRole, newRole },
    req,
    success: true
  });
}

async function logPaymentCompleted(userId, userEmail, paymentId, amount, req, metadata = {}) {
  return logAuditEvent({
    eventType: EventTypes.PAYMENT_COMPLETED,
    severity: Severity.INFO,
    userId,
    userEmail,
    action: `Payment completed: ${amount} PGK`,
    resourceType: 'payment',
    resourceId: paymentId?.toString(),
    metadata: { ...metadata, amount },
    req,
    success: true
  });
}

module.exports = {
  logAuditEvent,
  logLogin,
  logPasswordChange,
  logAccessDenied,
  logSuspiciousActivity,
  logRateLimitExceeded,
  logVoucherCreated,
  logVoucherRedeemed,
  logUserCreated,
  logUserModified,
  logRoleChanged,
  logPaymentCompleted,
  EventTypes,
  Severity
};
