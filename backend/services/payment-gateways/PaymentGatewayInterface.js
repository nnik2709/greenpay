/**
 * Payment Gateway Interface
 *
 * Abstract interface that all payment gateways must implement.
 * This allows easy switching between Stripe (test), BSP, Kina Bank, etc.
 *
 * Usage:
 * - Implement this interface for each payment gateway
 * - Configure active gateway in .env: PAYMENT_GATEWAY=stripe|bsp|kina
 * - All payment code uses this interface, never calls gateway directly
 */

class PaymentGatewayInterface {
  /**
   * Create a payment session
   *
   * @param {Object} params
   * @param {string} params.sessionId - Our internal purchase session ID
   * @param {string} params.customerEmail - Customer email
   * @param {string} params.customerPhone - Customer phone (+675XXXXXXXX)
   * @param {number} params.quantity - Number of vouchers (1-20)
   * @param {number} params.amountPGK - Total amount in PGK
   * @param {string} params.currency - Currency code (PGK, USD, AUD)
   * @param {string} params.returnUrl - Success callback URL
   * @param {string} params.cancelUrl - Cancel/failure callback URL
   * @param {Object} params.metadata - Additional data to track
   *
   * @returns {Promise<Object>} Payment session response
   * @returns {string} response.paymentUrl - URL to redirect customer
   * @returns {string} response.sessionId - Gateway session ID
   * @returns {Date} response.expiresAt - Session expiry time
   * @returns {Object} response.metadata - Any additional gateway data
   */
  async createPaymentSession(params) {
    throw new Error('createPaymentSession must be implemented');
  }

  /**
   * Verify payment session status
   *
   * @param {string} gatewaySessionId - Gateway's session ID
   * @returns {Promise<Object>} Session status
   * @returns {string} response.status - 'pending' | 'completed' | 'failed' | 'expired'
   * @returns {Object} response.paymentDetails - Payment information
   * @returns {string} response.paymentDetails.transactionId - Gateway transaction ID
   * @returns {string} response.paymentDetails.paymentMethod - Payment method used
   * @returns {number} response.paymentDetails.amount - Amount paid
   * @returns {string} response.paymentDetails.currency - Currency
   * @returns {Date} response.paymentDetails.completedAt - Payment completion time
   */
  async verifyPaymentSession(gatewaySessionId) {
    throw new Error('verifyPaymentSession must be implemented');
  }

  /**
   * Verify webhook signature/authenticity
   *
   * @param {string|Buffer} payload - Raw webhook payload
   * @param {string} signature - Webhook signature from headers
   * @param {string} secret - Webhook secret for verification
   * @returns {Object} Verified webhook event
   * @throws {Error} If signature is invalid
   */
  verifyWebhookSignature(payload, signature, secret) {
    throw new Error('verifyWebhookSignature must be implemented');
  }

  /**
   * Process webhook event
   *
   * @param {Object} event - Verified webhook event
   * @returns {Promise<Object>} Processing result
   * @returns {boolean} response.success - Whether processing succeeded
   * @returns {string} response.sessionId - Our internal session ID
   * @returns {string} response.status - Payment status
   * @returns {Object} response.data - Event-specific data
   */
  async processWebhookEvent(event) {
    throw new Error('processWebhookEvent must be implemented');
  }

  /**
   * Process refund
   *
   * @param {Object} params
   * @param {string} params.transactionId - Original transaction ID
   * @param {number} params.amount - Amount to refund (in smallest unit)
   * @param {string} params.reason - Refund reason
   * @returns {Promise<Object>} Refund result
   * @returns {string} response.refundId - Gateway refund ID
   * @returns {string} response.status - Refund status
   * @returns {number} response.amount - Refunded amount
   */
  async processRefund(params) {
    throw new Error('processRefund must be implemented');
  }

  /**
   * Get gateway name
   * @returns {string} Gateway identifier (e.g., 'stripe', 'bsp', 'kina')
   */
  getName() {
    throw new Error('getName must be implemented');
  }

  /**
   * Check if gateway is available/configured
   * @returns {boolean} True if gateway is ready to use
   */
  isAvailable() {
    throw new Error('isAvailable must be implemented');
  }
}

module.exports = PaymentGatewayInterface;
