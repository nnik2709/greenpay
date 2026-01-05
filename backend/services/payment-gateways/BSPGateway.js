/**
 * BSP DOKU Payment Gateway Adapter
 *
 * Implements DOKU Hosted Payment Pages API for BSP Bank PNG
 * API Version: 1.29 (December 02, 2019)
 *
 * Security Standards: PCI-DSS compliant implementation
 * Contact: servicebsp@bsp.com.pg | +675 3201212
 */

const crypto = require('crypto');
const PaymentGatewayInterface = require('./PaymentGatewayInterface');

class BSPGateway extends PaymentGatewayInterface {
  constructor() {
    super();

    // Validate required environment variables
    if (!process.env.BSP_DOKU_MALL_ID || !process.env.BSP_DOKU_SHARED_KEY) {
      throw new Error('[BSP DOKU] CRITICAL: Missing required credentials (BSP_DOKU_MALL_ID, BSP_DOKU_SHARED_KEY)');
    }

    this.config = {
      mallId: process.env.BSP_DOKU_MALL_ID,
      sharedKey: process.env.BSP_DOKU_SHARED_KEY,
      mode: process.env.BSP_DOKU_MODE || 'test',
      chainMerchant: process.env.BSP_DOKU_CHAIN_MERCHANT || 'NA',
      sandboxUrl: 'https://staging.doku.com',
      productionUrl: 'https://pay.doku.com',
      timeout: parseInt(process.env.BSP_DOKU_TIMEOUT || '30000', 10), // 30 seconds
      maxRetries: parseInt(process.env.BSP_DOKU_MAX_RETRIES || '3', 10),
    };

    // Production safety check
    if (this.config.mode === 'production') {
      console.log('[BSP DOKU] PRODUCTION MODE ENABLED');
      console.log('  Mall ID:', this.config.mallId);
      console.log('  Endpoint:', this.getEndpoint());
    } else {
      console.log('[BSP DOKU] TEST MODE - Using staging environment');
    }
  }

  /**
   * Generate WORDS signature for DOKU API
   * Formula: SHA1(AMOUNT + MALLID + SHARED_KEY + TRANSIDMERCHANT)
   * For non-IDR: SHA1(AMOUNT + MALLID + SHARED_KEY + TRANSIDMERCHANT + CURRENCY)
   *
   * @param {number|string} amount - Transaction amount
   * @param {string} transactionId - Merchant transaction ID
   * @param {string} currency - ISO3166 numeric currency code (default: 360 for IDR)
   * @returns {string} SHA1 hash signature
   */
  generateWords(amount, transactionId, currency = '360') {
    // Validate inputs
    if (!amount || !transactionId) {
      throw new Error('[BSP DOKU] Invalid parameters for WORDS generation');
    }

    // Format amount to 12.2 decimal format (required by DOKU)
    const amountFormatted = parseFloat(amount).toFixed(2);

    // Build WORDS string according to DOKU specification
    let wordsString;
    if (currency === '360') {
      // IDR currency (default)
      wordsString = `${amountFormatted}${this.config.mallId}${this.config.sharedKey}${transactionId}`;
    } else {
      // Non-IDR currencies (e.g., PGK = 598)
      wordsString = `${amountFormatted}${this.config.mallId}${this.config.sharedKey}${transactionId}${currency}`;
    }

    // Generate SHA1 hash
    const words = crypto.createHash('sha1').update(wordsString).digest('hex');

    // Log for debugging (NEVER log sensitive data in production)
    if (this.config.mode !== 'production') {
      console.log('[BSP DOKU] WORDS signature generated for transaction:', transactionId);
    }

    return words;
  }

  /**
   * Verify WORDS signature from DOKU webhook/response using constant-time comparison
   * Formula: SHA1(AMOUNT + MALLID + SHARED_KEY + TRANSIDMERCHANT + RESULTMSG + VERIFYSTATUS)
   *
   * SECURITY: Uses crypto.timingSafeEqual to prevent timing attacks
   *
   * @param {number|string} amount - Transaction amount
   * @param {string} transactionId - Merchant transaction ID
   * @param {string} resultMsg - Result message from DOKU
   * @param {string} verifyStatus - Verification status
   * @param {string} receivedWords - WORDS signature from DOKU
   * @param {string} currency - ISO3166 numeric currency code
   * @returns {boolean} True if signature is valid
   */
  verifyWords(amount, transactionId, resultMsg, verifyStatus, receivedWords, currency = '360') {
    // Validate all required parameters
    if (!amount || !transactionId || !resultMsg || !verifyStatus || !receivedWords) {
      console.error('[BSP DOKU] SECURITY: Missing required parameters for signature verification');
      return false;
    }

    // Format amount consistently
    const amountFormatted = parseFloat(amount).toFixed(2);

    // Build expected WORDS string
    let wordsString;
    if (currency === '360') {
      wordsString = `${amountFormatted}${this.config.mallId}${this.config.sharedKey}${transactionId}${resultMsg}${verifyStatus}`;
    } else {
      wordsString = `${amountFormatted}${this.config.mallId}${this.config.sharedKey}${transactionId}${resultMsg}${verifyStatus}${currency}`;
    }

    // Generate expected signature
    const expectedWords = crypto.createHash('sha1').update(wordsString).digest('hex');

    // SECURITY: Use constant-time comparison to prevent timing attacks
    // Convert hex strings to buffers for crypto.timingSafeEqual
    try {
      const expectedBuffer = Buffer.from(expectedWords, 'hex');
      const receivedBuffer = Buffer.from(receivedWords, 'hex');

      if (expectedBuffer.length !== receivedBuffer.length) {
        console.error('[BSP DOKU] SECURITY: Signature length mismatch');
        return false;
      }

      const isValid = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

      if (!isValid) {
        console.error('[BSP DOKU] SECURITY: Invalid WORDS signature for transaction:', transactionId);
      }

      return isValid;

    } catch (error) {
      console.error('[BSP DOKU] SECURITY: Signature verification error:', error.message);
      return false;
    }
  }

  /**
   * Get current timestamp in DOKU format: YYYYMMDDHHMMSS
   * @returns {string} Formatted timestamp
   */
  getRequestDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Sanitize input to prevent injection attacks
   * @param {string} input - User input to sanitize
   * @param {number} maxLength - Maximum allowed length
   * @returns {string} Sanitized input
   */
  sanitizeInput(input, maxLength = 255) {
    if (!input) return '';

    // Remove any potentially malicious characters
    // Allow only: alphanumeric, spaces, @, ., -, +, (, )
    const sanitized = String(input)
      .substring(0, maxLength)
      .replace(/[^a-zA-Z0-9\s@.\-+()]/g, '');

    return sanitized.trim();
  }

  /**
   * Validate email format
   * @param {string} email - Email address to validate
   * @returns {boolean} True if valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Create DOKU payment session with input validation and security checks
   *
   * @param {Object} params - Payment parameters
   * @returns {Object} Payment session details
   */
  async createPaymentSession(params) {
    const {
      sessionId,
      customerEmail,
      customerPhone = '',
      customerName = 'Customer',
      quantity,
      amountPGK,
      currency = 'PGK',
      returnUrl,
      cancelUrl,
      metadata = {}
    } = params;

    // Input validation
    if (!sessionId || !customerEmail || !amountPGK) {
      throw new Error('[BSP DOKU] Missing required payment parameters');
    }

    if (!this.isValidEmail(customerEmail)) {
      throw new Error('[BSP DOKU] Invalid customer email address');
    }

    // Validate amount is positive and reasonable
    const parsedAmount = parseFloat(amountPGK);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 999999.99) {
      throw new Error('[BSP DOKU] Invalid payment amount');
    }

    // Sanitize user inputs
    const sanitizedName = this.sanitizeInput(customerName, 50);
    const sanitizedPhone = this.sanitizeInput(customerPhone, 20);

    console.log('[BSP DOKU] Creating payment session');
    console.log('  Transaction ID:', sessionId);
    console.log('  Amount:', parsedAmount, currency);
    console.log('  Customer:', customerEmail);

    // DOKU uses ISO3166 numeric currency codes
    // PGK = 598 (Papua New Guinea Kina)
    // IDR = 360 (Indonesian Rupiah) - for testing
    // Allow override via environment variable for testing purposes
    const currencyCode = process.env.BSP_DOKU_TEST_CURRENCY || '598';

    // Format amount to 12.2 decimal format
    const amount = parsedAmount.toFixed(2);

    // Generate WORDS signature
    const words = this.generateWords(amount, sessionId, currencyCode);

    // Get request timestamp
    const requestDateTime = this.getRequestDateTime();

    // Prepare basket (transaction description)
    // Format: item_name,price,quantity,subtotal
    const basket = `Green Fee Voucher,${amount},${quantity},${amount}`;

    // Webhook URL for DOKU to send payment notifications
    const baseUrl = process.env.FRONTEND_URL || 'https://greenpay.eywademo.cloud';
    const responseUrl = `${baseUrl}/api/payment/webhook/doku/notify`;

    // Build payment request parameters (as per DOKU API section 3.2.2)
    const paymentParams = {
      MALLID: this.config.mallId,
      CHAINMERCHANT: this.config.chainMerchant,
      AMOUNT: amount,
      PURCHASEAMOUNT: amount,
      TRANSIDMERCHANT: sessionId,
      WORDS: words,
      REQUESTDATETIME: requestDateTime,
      CURRENCY: currencyCode,
      PURCHASECURRENCY: currencyCode,
      SESSIONID: sessionId,
      NAME: sanitizedName,
      EMAIL: customerEmail,
      BASKET: basket,
      PAYMENTCHANNEL: '15', // Credit Card (Visa/MasterCard/JCB)
      MOBILEPHONE: sanitizedPhone,
      RESPONSEURL: responseUrl, // Webhook notification URL
    };

    // Payment URL for DOKU hosted page
    const paymentUrl = `${this.getEndpoint()}/Suite/Receive`;

    console.log('[BSP DOKU] Payment session created successfully');
    console.log('  Payment URL:', paymentUrl);
    console.log('  Session expires at:', new Date(Date.now() + 15 * 60 * 1000).toISOString());

    return {
      paymentUrl: paymentUrl,
      sessionId: sessionId,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      metadata: {
        gateway: 'bsp-doku',
        mode: this.config.mode,
        formParams: paymentParams,
        isHostedPayment: true, // Indicates this requires form submission
      },
    };
  }

  /**
   * Verify payment session status using DOKU Check Status API
   *
   * @param {string} gatewaySessionId - Transaction ID to verify
   * @returns {Object} Payment status details
   */
  async verifyPaymentSession(gatewaySessionId) {
    console.log('[BSP DOKU] Verifying session:', gatewaySessionId);

    if (!gatewaySessionId) {
      throw new Error('[BSP DOKU] Invalid session ID for verification');
    }

    const currencyCode = '598'; // PGK

    // Generate WORDS for check status: MALLID + SHARED_KEY + TRANSIDMERCHANT
    const wordsString = `${this.config.mallId}${this.config.sharedKey}${gatewaySessionId}`;
    const words = crypto.createHash('sha1').update(wordsString).digest('hex');

    const checkStatusUrl = `${this.getEndpoint()}/Suite/CheckStatus`;

    const requestBody = new URLSearchParams({
      MALLID: this.config.mallId,
      CHAINMERCHANT: this.config.chainMerchant,
      TRANSIDMERCHANT: gatewaySessionId,
      SESSIONID: gatewaySessionId,
      WORDS: words,
      CURRENCY: currencyCode,
      PURCHASECURRENCY: currencyCode,
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(checkStatusUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'GreenPay/1.0',
        },
        body: requestBody.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();

      // SECURITY: Safer XML parsing using DOMParser or xml2js would be better
      // For now, use strict regex with proper escaping
      const resultMsg = this.extractXmlValue(xmlText, 'RESULTMSG') || 'UNKNOWN';
      const responseCode = this.extractXmlValue(xmlText, 'RESPONSECODE') || '5555';

      console.log('[BSP DOKU] Status check complete:', resultMsg, responseCode);

      return {
        status: resultMsg === 'SUCCESS' ? 'completed' : responseCode === '5511' ? 'pending' : 'failed',
        paymentDetails: {
          transactionId: gatewaySessionId,
          resultMsg: resultMsg,
          responseCode: responseCode,
        },
      };

    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('[BSP DOKU] Check Status timeout');
      } else {
        console.error('[BSP DOKU] Check Status error:', error.message);
      }

      return {
        status: 'pending',
        paymentDetails: null,
        error: error.message,
      };
    }
  }

  /**
   * Extract value from XML safely
   * @param {string} xml - XML string
   * @param {string} tag - Tag name to extract
   * @returns {string|null} Extracted value or null
   */
  extractXmlValue(xml, tag) {
    // Escape special regex characters in tag name
    const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`<${escapedTag}>(.*?)</${escapedTag}>`);
    const match = xml.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Verify webhook signature from DOKU
   * DOKU sends WORDS parameter that must be verified
   *
   * SECURITY: Critical function - validates all webhook requests
   *
   * @param {Object} payload - Webhook payload from DOKU
   * @param {string} signature - Not used (WORDS is in payload)
   * @param {string} secret - Not used (shared key from config)
   * @returns {Object} Validated payload
   * @throws {Error} If signature is invalid
   */
  verifyWebhookSignature(payload, signature = null, secret = null) {
    console.log('[BSP DOKU] Verifying webhook signature');

    if (!payload || typeof payload !== 'object') {
      throw new Error('[BSP DOKU] SECURITY: Invalid webhook payload');
    }

    // Extract parameters from webhook payload
    const {
      AMOUNT,
      TRANSIDMERCHANT,
      RESULTMSG,
      VERIFYSTATUS,
      WORDS: receivedWords,
      CURRENCY = '598'
    } = payload;

    // Validate all required parameters are present
    if (!AMOUNT || !TRANSIDMERCHANT || !RESULTMSG || !VERIFYSTATUS || !receivedWords) {
      throw new Error('[BSP DOKU] SECURITY: Missing required webhook parameters');
    }

    // Verify WORDS signature using constant-time comparison
    const isValid = this.verifyWords(
      AMOUNT,
      TRANSIDMERCHANT,
      RESULTMSG,
      VERIFYSTATUS,
      receivedWords,
      CURRENCY
    );

    if (!isValid) {
      throw new Error('[BSP DOKU] SECURITY: Invalid WORDS signature in webhook');
    }

    console.log('[BSP DOKU] Webhook signature verified successfully');
    return payload;
  }

  /**
   * Process webhook event from DOKU
   * DOKU sends Notify and Redirect webhooks
   *
   * @param {Object} event - Webhook event from DOKU
   * @returns {Object} Processing result
   */
  async processWebhookEvent(event) {
    console.log('[BSP DOKU] Processing webhook event');
    console.log('  Transaction ID:', event.TRANSIDMERCHANT);
    console.log('  Result:', event.RESULTMSG);
    console.log('  Response Code:', event.RESPONSECODE);

    // DOKU Response Codes:
    // 0000 = Success
    // 5511 = Payment not yet completed (pending)
    // Others = Failed
    const isSuccess = event.RESPONSECODE === '0000' && event.RESULTMSG === 'SUCCESS';

    return {
      success: true,
      sessionId: event.TRANSIDMERCHANT,
      status: isSuccess ? 'completed' : event.RESPONSECODE === '5511' ? 'pending' : 'failed',
      data: {
        approvalCode: event.APPROVALCODE || '',
        paymentChannel: event.PAYMENTCHANNEL || '',
        paymentDateTime: event.PAYMENTDATETIME || '',
        bank: event.BANK || '',
        maskedCardNumber: event.MCN || '',
        responseCode: event.RESPONSECODE || '',
        resultMsg: event.RESULTMSG || '',
        verifyStatus: event.VERIFYSTATUS || '',
        sessionId: event.SESSIONID || '',
      },
    };
  }

  /**
   * Process refund via DOKU Void/Refund API
   *
   * Note: DOKU refund requires specific bank acquirer support
   * Void: Cancel unsettled transactions
   * Refund: Return funds from settled transactions
   *
   * @param {Object} params - Refund parameters
   * @returns {Object} Refund result
   */
  async processRefund(params) {
    const { transactionId, amount, reason } = params;

    console.log('[BSP DOKU] Processing refund/void request');
    console.log('  Transaction ID:', transactionId);
    console.log('  Amount:', amount);

    if (!transactionId) {
      throw new Error('[BSP DOKU] Missing transaction ID for refund');
    }

    const refundUrl = `${this.getEndpoint()}/Suite/VoidRequest`;

    // Generate WORDS for void request
    const wordsString = `${this.config.mallId}${this.config.sharedKey}${transactionId}`;
    const words = crypto.createHash('sha1').update(wordsString).digest('hex');

    const requestBody = new URLSearchParams({
      MALLID: this.config.mallId,
      CHAINMERCHANT: this.config.chainMerchant,
      TRANSIDMERCHANT: transactionId,
      WORDS: words,
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(refundUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'GreenPay/1.0',
        },
        body: requestBody.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.text();
      console.log('[BSP DOKU] Void/Refund response received');

      const isSuccess = result.includes('SUCCESS') || result.includes('0000');

      return {
        refundId: `VOID-${transactionId}`,
        status: isSuccess ? 'completed' : 'pending',
        amount: amount,
        currency: 'PGK',
      };

    } catch (error) {
      console.error('[BSP DOKU] Void/Refund error:', error.message);
      return {
        refundId: `VOID-${transactionId}`,
        status: 'failed',
        amount: amount,
        currency: 'PGK',
        error: error.message,
      };
    }
  }

  /**
   * Get gateway name identifier
   * @returns {string} Gateway name
   */
  getName() {
    return 'bsp';
  }

  /**
   * Check if gateway is available and properly configured
   * @returns {boolean} True if available
   */
  isAvailable() {
    // Check if BSP DOKU credentials are configured
    if (!this.config.mallId || !this.config.sharedKey) {
      console.warn('[BSP DOKU] Gateway not available - missing credentials');
      return false;
    }

    return true;
  }

  /**
   * Get DOKU API endpoint based on mode
   * @returns {string} API endpoint URL
   */
  getEndpoint() {
    return this.config.mode === 'production'
      ? this.config.productionUrl
      : this.config.sandboxUrl;
  }
}

module.exports = BSPGateway;
