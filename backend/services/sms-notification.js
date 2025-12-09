/**
 * SMS Notification Service for PNG
 *
 * MOCK IMPLEMENTATION - Placeholder for actual SMS gateway
 *
 * TO INTEGRATE WITH REAL SMS GATEWAY:
 * 1. Choose SMS provider for PNG:
 *    - Digicel PNG: Contact for SMS API access
 *    - Bmobile (Telikom PNG): Contact for SMS API access
 *    - Twilio: Works internationally (may have higher costs)
 *    - PNG-based SMS aggregators
 *
 * 2. Install SMS SDK/library:
 *    npm install twilio
 *    OR npm install @messagebird/sdk
 *    OR custom HTTP client for local PNG SMS gateway
 *
 * 3. Set environment variables:
 *    SMS_PROVIDER=digicel|bmobile|twilio
 *    SMS_API_KEY=your_api_key
 *    SMS_SENDER_ID=GreenFees (or approved sender ID)
 *
 * 4. Replace mock functions with actual API calls
 */

// SMS Gateway Configuration
const SMS_CONFIG = {
  provider: process.env.SMS_PROVIDER || 'mock',
  apiKey: process.env.SMS_API_KEY || 'MOCK_API_KEY',
  apiSecret: process.env.SMS_API_SECRET || 'MOCK_SECRET',
  senderId: process.env.SMS_SENDER_ID || 'GreenFees',

  // PNG-specific settings
  countryCode: '+675',
  maxLength: 160, // Standard SMS length
  enabled: process.env.SMS_ENABLED === 'true' || false,
};

/**
 * Format PNG phone number
 * Converts various formats to +675XXXXXXXX
 */
const formatPNGPhone = (phone) => {
  if (!phone) return null;

  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');

  // Remove leading 675 if present
  if (cleaned.startsWith('675')) {
    cleaned = cleaned.slice(3);
  }

  // Remove leading 0 if present
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  // Validate length (PNG mobile numbers are 7-8 digits)
  if (cleaned.length < 7 || cleaned.length > 8) {
    throw new Error(`Invalid PNG phone number: ${phone}`);
  }

  return `+675${cleaned}`;
};

/**
 * Validate PNG mobile number
 */
const isValidPNGNumber = (phone) => {
  try {
    const formatted = formatPNGPhone(phone);
    return formatted !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Send SMS (Generic)
 *
 * @param {string} to - Recipient phone number
 * @param {string} message - SMS message content
 * @param {Object} options - Additional options
 *
 * @returns {Promise<Object>} Send result
 */
const sendSMS = async (to, message, options = {}) => {
  try {
    if (!SMS_CONFIG.enabled) {
      console.log('[SMS MOCK] SMS sending is disabled. Would send:', { to, message });
      return {
        success: true,
        provider: 'mock',
        messageId: `MOCK-${Date.now()}`,
        to: to,
        message: 'SMS sending is disabled (mock mode)'
      };
    }

    // Format phone number
    const formattedPhone = formatPNGPhone(to);

    // Truncate message if too long
    let finalMessage = message;
    if (message.length > SMS_CONFIG.maxLength) {
      console.warn(`SMS message truncated from ${message.length} to ${SMS_CONFIG.maxLength} characters`);
      finalMessage = message.substring(0, SMS_CONFIG.maxLength - 3) + '...';
    }

    console.log('[SMS] Sending SMS:', {
      provider: SMS_CONFIG.provider,
      to: formattedPhone,
      messageLength: finalMessage.length
    });

    // MOCK IMPLEMENTATION
    // Replace with actual SMS gateway call
    /*
    // Example with Twilio:
    const twilio = require('twilio');
    const client = twilio(SMS_CONFIG.apiKey, SMS_CONFIG.apiSecret);

    const result = await client.messages.create({
      body: finalMessage,
      from: SMS_CONFIG.senderId,
      to: formattedPhone
    });

    return {
      success: true,
      provider: 'twilio',
      messageId: result.sid,
      status: result.status,
      to: formattedPhone
    };
    */

    // MOCK: Simulate sending
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockResult = {
          success: true,
          provider: 'mock',
          messageId: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'sent',
          to: formattedPhone,
          sentAt: new Date().toISOString(),
          message: 'MOCK: SMS sent successfully'
        };

        console.log('[SMS MOCK] SMS sent:', mockResult);
        resolve(mockResult);
      }, 100);
    });

  } catch (error) {
    console.error('[SMS ERROR] Failed to send SMS:', error);
    throw new Error(`SMS sending failed: ${error.message}`);
  }
};

/**
 * Send Voucher Code via SMS
 *
 * @param {string} phone - Recipient phone number (+675XXXXXXXX)
 * @param {string} voucherCode - Voucher code
 * @param {Object} details - Additional voucher details
 *
 * @returns {Promise<Object>} Send result
 */
const sendVoucherSMS = async (phone, voucherCode, details = {}) => {
  try {
    const { amount = 50, validUntil, registrationUrl } = details;

    // Construct SMS message (keep it concise for PNG networks)
    const message =
      `PNG Green Fees Voucher\n` +
      `Code: ${voucherCode}\n` +
      `Value: PGK ${amount}\n` +
      `Valid: ${validUntil ? new Date(validUntil).toLocaleDateString() : '30 days'}\n` +
      `Register: ${registrationUrl || 'greenpay.eywademo.cloud'}`;

    console.log('[SMS] Sending voucher SMS to:', phone);

    const result = await sendSMS(phone, message, {
      type: 'voucher',
      voucherCode: voucherCode
    });

    return result;

  } catch (error) {
    console.error('[SMS ERROR] Failed to send voucher SMS:', error);
    throw error;
  }
};

/**
 * Send Multiple Voucher Codes via SMS
 *
 * @param {string} phone - Recipient phone number
 * @param {Array} vouchers - Array of voucher objects
 *
 * @returns {Promise<Array>} Array of send results
 */
const sendMultipleVouchersSMS = async (phone, vouchers) => {
  try {
    // If only 1 voucher, send simple SMS
    if (vouchers.length === 1) {
      return [await sendVoucherSMS(phone, vouchers[0].voucher_code, {
        amount: vouchers[0].amount,
        validUntil: vouchers[0].valid_until
      })];
    }

    // If 2-3 vouchers, send in one SMS
    if (vouchers.length <= 3) {
      const codes = vouchers.map(v => v.voucher_code).join(', ');
      const message =
        `PNG Green Fees\n` +
        `${vouchers.length} Vouchers:\n` +
        `${codes}\n` +
        `PGK ${vouchers[0].amount} each\n` +
        `Register: greenpay.eywademo.cloud`;

      return [await sendSMS(phone, message, { type: 'multiple_vouchers' })];
    }

    // If more than 3 vouchers, send summary SMS
    const message =
      `PNG Green Fees\n` +
      `${vouchers.length} vouchers purchased\n` +
      `Check your email for codes\n` +
      `Or call: +675 XXX XXXX`;

    return [await sendSMS(phone, message, { type: 'voucher_summary' })];

  } catch (error) {
    console.error('[SMS ERROR] Failed to send multiple vouchers SMS:', error);
    throw error;
  }
};

/**
 * Send Payment Confirmation SMS
 *
 * @param {string} phone - Recipient phone number
 * @param {Object} paymentDetails - Payment details
 *
 * @returns {Promise<Object>} Send result
 */
const sendPaymentConfirmationSMS = async (phone, paymentDetails) => {
  try {
    const {
      amount,
      transactionId,
      voucherCount
    } = paymentDetails;

    const message =
      `PNG Green Fees\n` +
      `Payment Confirmed\n` +
      `Amount: PGK ${amount}\n` +
      `Ref: ${transactionId}\n` +
      `${voucherCount} voucher(s) sent`;

    return await sendSMS(phone, message, {
      type: 'payment_confirmation',
      transactionId: transactionId
    });

  } catch (error) {
    console.error('[SMS ERROR] Failed to send payment confirmation:', error);
    throw error;
  }
};

/**
 * Send Registration Reminder SMS
 *
 * @param {string} phone - Recipient phone number
 * @param {string} voucherCode - Voucher code
 * @param {Date} expiryDate - Voucher expiry date
 *
 * @returns {Promise<Object>} Send result
 */
const sendRegistrationReminderSMS = async (phone, voucherCode, expiryDate) => {
  try {
    const daysLeft = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));

    const message =
      `PNG Green Fees Reminder\n` +
      `Voucher ${voucherCode}\n` +
      `Expires in ${daysLeft} days\n` +
      `Register passport now\n` +
      `greenpay.eywademo.cloud`;

    return await sendSMS(phone, message, {
      type: 'registration_reminder',
      voucherCode: voucherCode
    });

  } catch (error) {
    console.error('[SMS ERROR] Failed to send reminder:', error);
    throw error;
  }
};

/**
 * Check SMS delivery status
 *
 * @param {string} messageId - SMS message ID
 *
 * @returns {Promise<Object>} Delivery status
 */
const checkSMSStatus = async (messageId) => {
  try {
    // MOCK: Simulate status check
    return {
      messageId: messageId,
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
      provider: 'mock'
    };

  } catch (error) {
    console.error('[SMS ERROR] Failed to check status:', error);
    throw error;
  }
};

/**
 * Get SMS sending statistics
 *
 * @returns {Promise<Object>} SMS statistics
 */
const getSMSStats = async () => {
  try {
    // MOCK: Return mock statistics
    return {
      enabled: SMS_CONFIG.enabled,
      provider: SMS_CONFIG.provider,
      totalSent: 0,
      totalFailed: 0,
      totalPending: 0,
      lastSentAt: null
    };

  } catch (error) {
    console.error('[SMS ERROR] Failed to get stats:', error);
    throw error;
  }
};

module.exports = {
  sendSMS,
  sendVoucherSMS,
  sendMultipleVouchersSMS,
  sendPaymentConfirmationSMS,
  sendRegistrationReminderSMS,
  checkSMSStatus,
  getSMSStats,
  formatPNGPhone,
  isValidPNGNumber,
  SMS_CONFIG
};
