/**
 * BSP Bank PNG Payment Gateway Service
 *
 * MOCK IMPLEMENTATION - Placeholder for actual BSP integration
 *
 * TO INTEGRATE WITH REAL BSP API:
 * 1. Contact BSP: servicebsp@bsp.com.pg or +675 3201212
 * 2. Register for merchant account
 * 3. Obtain API credentials (Merchant ID, API Key, endpoints)
 * 4. Get API documentation
 * 5. Replace mock functions with actual BSP API calls
 *
 * IMPORTANT: This mock implementation is for development/testing only!
 */

// Mock BSP API Configuration
const BSP_CONFIG = {
  // REPLACE WITH REAL VALUES FROM BSP
  sandboxMode: true, // Set to false in production
  merchantId: 'MOCK_MERCHANT_ID', // Replace with actual merchant ID from BSP
  apiKey: 'MOCK_API_KEY', // Replace with actual API key (store in .env)

  // ENDPOINTS - Replace with actual BSP endpoints
  sandboxEndpoint: 'https://sandbox-bsp-api.example.com',
  productionEndpoint: 'https://api-bsp.com.pg',

  // Timeouts
  sessionTimeout: 15 * 60 * 1000, // 15 minutes
};

/**
 * Get BSP API endpoint based on environment
 */
const getBSPEndpoint = () => {
  return BSP_CONFIG.sandboxMode
    ? BSP_CONFIG.sandboxEndpoint
    : BSP_CONFIG.productionEndpoint;
};

/**
 * Generate unique merchant reference for transaction tracking
 * Format: PGKB-YYYYMMDD-XXXXXX
 */
export const generateMerchantReference = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `PGKB-${date}-${random}`;
};

/**
 * Initiate BSP Payment
 *
 * @param {Object} paymentData - Payment details
 * @param {string} paymentData.merchantReference - Our unique reference
 * @param {number} paymentData.amount - Amount in PGK
 * @param {string} paymentData.currency - Currency code (PGK)
 * @param {string} paymentData.customerEmail - Customer email
 * @param {string} paymentData.customerPhone - Customer phone (+675XXXXXXXX)
 * @param {string} paymentData.customerName - Customer name
 * @param {string} paymentData.description - Payment description
 * @param {string} paymentData.returnUrl - Success callback URL
 * @param {string} paymentData.cancelUrl - Cancel callback URL
 * @param {Object} paymentData.metadata - Additional data
 *
 * @returns {Promise<Object>} Payment initiation response
 */
export const initiateBSPPayment = async (paymentData) => {
  try {
    console.log('🏦 [BSP MOCK] Initiating payment:', paymentData);

    // Validate required fields
    if (!paymentData.merchantReference) {
      throw new Error('Merchant reference is required');
    }
    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new Error('Valid amount is required');
    }
    if (!paymentData.returnUrl) {
      throw new Error('Return URL is required');
    }

    // MOCK: Simulate API request to BSP
    // In production, this would be:
    /*
    const response = await fetch(`${getBSPEndpoint()}/payment/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BSP_CONFIG.apiKey}`,
        'X-Merchant-ID': BSP_CONFIG.merchantId
      },
      body: JSON.stringify({
        merchant_reference: paymentData.merchantReference,
        amount: paymentData.amount,
        currency: paymentData.currency || 'PGK',
        customer: {
          email: paymentData.customerEmail,
          phone: paymentData.customerPhone,
          name: paymentData.customerName
        },
        description: paymentData.description,
        callback_urls: {
          success: paymentData.returnUrl,
          cancel: paymentData.cancelUrl,
          webhook: paymentData.webhookUrl
        },
        metadata: paymentData.metadata
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'BSP payment initiation failed');
    }

    return {
      success: true,
      merchantReference: paymentData.merchantReference,
      bspTransactionId: result.transaction_id,
      paymentUrl: result.payment_url,
      expiresAt: result.expires_at
    };
    */

    // MOCK IMPLEMENTATION - Simulates BSP API response
    return new Promise((resolve) => {
      setTimeout(() => {
        const bspTransactionId = `BSP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Generate mock BSP payment URL with embedded parameters
        const mockPaymentUrl = `${window.location.origin}/mock-bsp-payment?` +
          `merchant_ref=${encodeURIComponent(paymentData.merchantReference)}` +
          `&amount=${paymentData.amount}` +
          `&currency=${paymentData.currency || 'PGK'}` +
          `&txn_id=${bspTransactionId}` +
          `&return_url=${encodeURIComponent(paymentData.returnUrl)}` +
          `&cancel_url=${encodeURIComponent(paymentData.cancelUrl || paymentData.returnUrl)}`;

        const response = {
          success: true,
          merchantReference: paymentData.merchantReference,
          bspTransactionId: bspTransactionId,
          paymentUrl: mockPaymentUrl,
          expiresAt: new Date(Date.now() + BSP_CONFIG.sessionTimeout).toISOString(),
          message: 'MOCK: Payment session created successfully'
        };

        console.log('🏦 [BSP MOCK] Payment initiated:', response);
        resolve(response);
      }, 500); // Simulate network delay
    });

  } catch (error) {
    console.error('🏦 [BSP ERROR] Payment initiation failed:', error);
    throw new Error(`BSP Payment Error: ${error.message}`);
  }
};

/**
 * Verify BSP Payment Status
 * Called after customer returns from BSP payment page
 *
 * @param {string} merchantReference - Our merchant reference
 * @param {string} bspTransactionId - BSP's transaction ID
 *
 * @returns {Promise<Object>} Payment verification result
 */
export const verifyBSPPayment = async (merchantReference, bspTransactionId) => {
  try {
    console.log('🏦 [BSP MOCK] Verifying payment:', { merchantReference, bspTransactionId });

    // MOCK: Simulate API call to BSP for payment verification
    // In production, this would be:
    /*
    const response = await fetch(`${getBSPEndpoint()}/payment/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BSP_CONFIG.apiKey}`,
        'X-Merchant-ID': BSP_CONFIG.merchantId
      },
      body: JSON.stringify({
        merchant_reference: merchantReference,
        transaction_id: bspTransactionId
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Payment verification failed');
    }

    return {
      success: result.status === 'completed' || result.status === 'success',
      status: result.status,
      merchantReference: merchantReference,
      bspTransactionId: result.transaction_id,
      amount: result.amount,
      currency: result.currency,
      paymentMethod: result.payment_method,
      cardLastFour: result.card_last_four,
      paymentDate: result.payment_date,
      authCode: result.auth_code
    };
    */

    // MOCK IMPLEMENTATION
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock successful payment
        const result = {
          success: true,
          status: 'completed',
          merchantReference: merchantReference,
          bspTransactionId: bspTransactionId,
          amount: 50.00, // Mock amount
          currency: 'PGK',
          paymentMethod: 'VISA',
          cardLastFour: '4242',
          paymentDate: new Date().toISOString(),
          authCode: `AUTH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          message: 'MOCK: Payment verified successfully'
        };

        console.log('🏦 [BSP MOCK] Payment verified:', result);
        resolve(result);
      }, 300);
    });

  } catch (error) {
    console.error('🏦 [BSP ERROR] Payment verification failed:', error);
    throw new Error(`BSP Verification Error: ${error.message}`);
  }
};

/**
 * Verify BSP Webhook Signature
 * Called when BSP sends payment notification to our webhook endpoint
 *
 * @param {Object} webhookData - Data received from BSP webhook
 * @param {string} signature - BSP signature header
 *
 * @returns {boolean} True if signature is valid
 */
export const verifyBSPWebhookSignature = (webhookData, signature) => {
  // MOCK: In production, verify webhook using BSP's signature algorithm
  // Example (pseudo-code):
  /*
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', BSP_CONFIG.webhookSecret)
    .update(JSON.stringify(webhookData))
    .digest('hex');

  return expectedSignature === signature;
  */

  console.log('🏦 [BSP MOCK] Verifying webhook signature');

  // MOCK: Always return true for development
  return true;
};

/**
 * Handle BSP Webhook Callback
 * Process payment notification from BSP
 *
 * @param {Object} webhookData - Webhook payload from BSP
 *
 * @returns {Promise<Object>} Processing result
 */
export const handleBSPWebhook = async (webhookData) => {
  try {
    console.log('🏦 [BSP MOCK] Processing webhook:', webhookData);

    // Extract data from webhook
    const {
      merchant_reference,
      transaction_id,
      status,
      amount,
      currency,
      payment_method,
      card_last_four,
      error_message
    } = webhookData;

    // Map BSP status to our internal status
    let paymentStatus;
    if (status === 'completed' || status === 'success') {
      paymentStatus = 'success';
    } else if (status === 'failed' || status === 'declined') {
      paymentStatus = 'failed';
    } else {
      paymentStatus = 'pending';
    }

    return {
      success: paymentStatus === 'success',
      merchantReference: merchant_reference,
      bspTransactionId: transaction_id,
      status: paymentStatus,
      amount: amount,
      currency: currency,
      paymentMethod: payment_method,
      cardLastFour: card_last_four,
      errorMessage: error_message,
      processedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('🏦 [BSP ERROR] Webhook processing failed:', error);
    throw new Error(`Webhook Processing Error: ${error.message}`);
  }
};

/**
 * Cancel/Refund Payment
 * Request refund for a completed payment
 *
 * @param {string} bspTransactionId - BSP transaction ID
 * @param {number} amount - Amount to refund (optional, defaults to full amount)
 * @param {string} reason - Refund reason
 *
 * @returns {Promise<Object>} Refund result
 */
export const requestBSPRefund = async (bspTransactionId, amount, reason) => {
  try {
    console.log('🏦 [BSP MOCK] Requesting refund:', { bspTransactionId, amount, reason });

    // MOCK: Simulate refund request
    // In production, call BSP refund API

    return new Promise((resolve) => {
      setTimeout(() => {
        const result = {
          success: true,
          refundId: `RFD-${Date.now()}`,
          bspTransactionId: bspTransactionId,
          amount: amount,
          status: 'processing',
          message: 'MOCK: Refund request submitted successfully',
          estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };

        console.log('🏦 [BSP MOCK] Refund requested:', result);
        resolve(result);
      }, 500);
    });

  } catch (error) {
    console.error('🏦 [BSP ERROR] Refund request failed:', error);
    throw new Error(`BSP Refund Error: ${error.message}`);
  }
};

/**
 * Get Payment Methods Available
 * Query BSP for available payment methods
 *
 * @returns {Promise<Array>} List of available payment methods
 */
export const getBSPPaymentMethods = async () => {
  // MOCK: Return available payment methods
  return [
    {
      id: 'visa',
      name: 'Visa Debit/Credit',
      type: 'card',
      icon: '💳',
      enabled: true
    },
    {
      id: 'mastercard',
      name: 'Mastercard Debit/Credit',
      type: 'card',
      icon: '💳',
      enabled: true
    },
    {
      id: 'bsp_pay',
      name: 'BSP Pay',
      type: 'mobile_app',
      icon: '📱',
      enabled: true
    },
    {
      id: 'mobile_money',
      name: 'Mobile Money (USSD *131#)',
      type: 'ussd',
      icon: '📞',
      enabled: true
    },
    {
      id: 'eftpos',
      name: 'EFTPOS Online',
      type: 'bank_transfer',
      icon: '🏦',
      enabled: true
    }
  ];
};

// Export configuration for testing
export const getBSPConfig = () => ({
  ...BSP_CONFIG,
  apiKey: '***HIDDEN***' // Don't expose API key
});

export default {
  initiateBSPPayment,
  verifyBSPPayment,
  verifyBSPWebhookSignature,
  handleBSPWebhook,
  requestBSPRefund,
  getBSPPaymentMethods,
  generateMerchantReference,
  getBSPConfig
};
