/**
 * Payment Gateway Service
 * Handles integration with Kina Bank IPG and other payment gateways
 */


// =====================================================
// Constants
// =====================================================
const GATEWAY_NAMES = {
  KINA_BANK: 'KINA_BANK',
  BSP: 'BSP'
};

const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
};

// =====================================================
// Gateway Configuration
// =====================================================

/**
 * Get payment gateway configuration
 * @param {string} gatewayName - Name of the gateway (KINA_BANK, BSP)
 * @returns {Promise<Object>} Gateway configuration
 */
export const getGatewayConfig = async (gatewayName) => {
  try {
    const { data, error } = await supabase
      .from('payment_gateway_config')
      .select('*')
      .eq('gateway_name', gatewayName)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      gatewayName: data.gateway_name,
      isActive: data.is_active,
      merchantId: data.merchant_id,
      apiEndpoint: data.api_endpoint_url,
      sandboxMode: data.sandbox_mode,
      config: data.config_json
    };
  } catch (error) {
    console.error(`Failed to get ${gatewayName} config:`, error);
    throw error;
  }
};

/**
 * Update payment gateway configuration (Admin only)
 * @param {string} gatewayName - Name of the gateway
 * @param {Object} updates - Configuration updates
 * @returns {Promise<Object>} Updated configuration
 */
export const updateGatewayConfig = async (gatewayName, updates) => {
  try {
    const updateData = {};
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.merchantId !== undefined) updateData.merchant_id = updates.merchantId;
    if (updates.apiEndpoint !== undefined) updateData.api_endpoint_url = updates.apiEndpoint;
    if (updates.sandboxMode !== undefined) updateData.sandbox_mode = updates.sandboxMode;
    if (updates.config !== undefined) updateData.config_json = updates.config;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('payment_gateway_config')
      .update(updateData)
      .eq('gateway_name', gatewayName)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      gatewayName: data.gateway_name,
      isActive: data.is_active,
      merchantId: data.merchant_id,
      apiEndpoint: data.api_endpoint_url,
      sandboxMode: data.sandbox_mode,
      config: data.config_json
    };
  } catch (error) {
    console.error(`Failed to update ${gatewayName} config:`, error);
    throw error;
  }
};

/**
 * Check if a gateway is active and configured
 * @param {string} gatewayName - Name of the gateway
 * @returns {Promise<boolean>} True if gateway is active
 */
export const isGatewayActive = async (gatewayName) => {
  try {
    const config = await getGatewayConfig(gatewayName);
    return config.isActive;
  } catch (error) {
    return false;
  }
};

// =====================================================
// Transaction Management
// =====================================================

/**
 * Generate a unique merchant reference for transaction tracking
 * @returns {Promise<string>} Merchant reference
 */
export const generateMerchantReference = async () => {
  try {
    const { data, error } = await supabase.rpc('generate_merchant_reference');
    if (error) throw error;
    return data;
  } catch (error) {
    // Fallback if RPC fails
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `PGKB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${random}`;
  }
};

/**
 * Create a payment gateway transaction record
 * @param {Object} transactionData - Transaction details
 * @returns {Promise<Object>} Created transaction
 */
export const createGatewayTransaction = async (transactionData, userId) => {
  try {
    const merchantReference = await generateMerchantReference();

    const { data, error } = await supabase
      .from('payment_gateway_transactions')
      .insert({
        purchase_id: transactionData.purchaseId || null,
        gateway_name: transactionData.gatewayName,
        merchant_reference: merchantReference,
        amount: transactionData.amount,
        currency: transactionData.currency || 'PGK',
        status: TRANSACTION_STATUS.PENDING,
        customer_email: transactionData.customerEmail,
        customer_name: transactionData.customerName,
        request_payload: transactionData.requestPayload || {},
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      merchantReference: data.merchant_reference,
      gatewayName: data.gateway_name,
      amount: data.amount,
      status: data.status,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Failed to create gateway transaction:', error);
    throw error;
  }
};

/**
 * Update transaction status
 * @param {string} merchantReference - Our merchant reference
 * @param {Object} updates - Status updates
 * @returns {Promise<Object>} Updated transaction
 */
export const updateTransactionStatus = async (merchantReference, updates) => {
  try {
    const { data, error } = await supabase.rpc(
      'update_gateway_transaction_status',
      {
        p_merchant_reference: merchantReference,
        p_status: updates.status,
        p_transaction_reference: updates.transactionReference || null,
        p_callback_data: updates.callbackData || null,
        p_error_message: updates.errorMessage || null
      }
    );

    if (error) throw error;

    return {
      id: data.id,
      merchantReference: data.merchant_reference,
      transactionReference: data.transaction_reference,
      status: data.status,
      paymentDate: data.payment_date,
      errorMessage: data.error_message
    };
  } catch (error) {
    console.error('Failed to update transaction status:', error);
    throw error;
  }
};

/**
 * Get transaction by merchant reference
 * @param {string} merchantReference - Merchant reference
 * @returns {Promise<Object>} Transaction details
 */
export const getTransactionByReference = async (merchantReference) => {
  try {
    const { data, error } = await supabase
      .from('payment_gateway_transactions')
      .select('*')
      .eq('merchant_reference', merchantReference)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      purchaseId: data.purchase_id,
      gatewayName: data.gateway_name,
      merchantReference: data.merchant_reference,
      transactionReference: data.transaction_reference,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      paymentMethod: data.payment_method,
      cardLastFour: data.card_last_four,
      customerEmail: data.customer_email,
      customerName: data.customer_name,
      requestPayload: data.request_payload,
      responsePayload: data.response_payload,
      callbackData: data.callback_data,
      errorCode: data.error_code,
      errorMessage: data.error_message,
      paymentDate: data.payment_date,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Failed to get transaction:', error);
    throw error;
  }
};

/**
 * Get all transactions with filters
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} List of transactions
 */
export const getGatewayTransactions = async (filters = {}) => {
  try {
    let query = supabase
      .from('payment_gateway_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.gatewayName) {
      query = query.eq('gateway_name', filters.gatewayName);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(t => ({
      id: t.id,
      purchaseId: t.purchase_id,
      gatewayName: t.gateway_name,
      merchantReference: t.merchant_reference,
      transactionReference: t.transaction_reference,
      amount: t.amount,
      status: t.status,
      paymentMethod: t.payment_method,
      customerEmail: t.customer_email,
      paymentDate: t.payment_date,
      createdAt: t.created_at
    }));
  } catch (error) {
    console.error('Failed to get transactions:', error);
    return [];
  }
};

// =====================================================
// Kina Bank IPG Integration
// =====================================================

/**
 * Initiate Kina Bank payment
 * NOTE: This is a placeholder - actual implementation requires Kina Bank API documentation
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} Payment initiation response
 */
export const initiateKinaBankPayment = async (paymentData, userId) => {
  try {
    // Get Kina Bank configuration
    const config = await getGatewayConfig(GATEWAY_NAMES.KINA_BANK);

    if (!config.isActive) {
      throw new Error('Kina Bank payment gateway is not active. Please contact administrator.');
    }

    // Create transaction record
    const transaction = await createGatewayTransaction({
      gatewayName: GATEWAY_NAMES.KINA_BANK,
      amount: paymentData.amount,
      currency: 'PGK',
      customerEmail: paymentData.customerEmail,
      customerName: paymentData.customerName,
      requestPayload: {
        passportNumber: paymentData.passportNumber,
        nationality: paymentData.nationality,
        description: paymentData.description || 'PNG Green Fees Payment'
      }
    }, userId);

    // TODO: Replace with actual Kina Bank API call
    // This is a placeholder structure based on common payment gateway patterns
    const apiEndpoint = config.sandboxMode
      ? config.apiEndpoint || 'https://sandbox.kinabank.com.pg/api/payment/initiate'
      : config.apiEndpoint || 'https://api.kinabank.com.pg/payment/initiate';

    const requestPayload = {
      merchant_id: config.merchantId,
      merchant_reference: transaction.merchantReference,
      amount: paymentData.amount,
      currency: 'PGK',
      description: paymentData.description || 'PNG Green Fees Payment',
      customer_email: paymentData.customerEmail,
      customer_name: paymentData.customerName,
      return_url: paymentData.returnUrl || `${window.location.origin}/payment-callback`,
      cancel_url: paymentData.cancelUrl || `${window.location.origin}/payment-cancelled`,
      webhook_url: paymentData.webhookUrl || `${window.location.origin}/api/payment-webhook`,
      metadata: {
        passport_number: paymentData.passportNumber,
        nationality: paymentData.nationality
      }
    };

    // NOTE: Actual API call will be implemented once Kina Bank provides documentation
    // For now, return structure for frontend integration
    console.log('Kina Bank Payment Request:', {
      endpoint: apiEndpoint,
      payload: requestPayload
    });

    // In production, this will make an actual HTTP request to Kina Bank API
    // const response = await fetch(apiEndpoint, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${config.apiKey}` // Will be stored encrypted
    //   },
    //   body: JSON.stringify(requestPayload)
    // });
    // const result = await response.json();

    // Simulated response structure (update based on actual Kina Bank API)
    const simulatedResponse = {
      success: true,
      transaction_id: `KINA-${Date.now()}`, // Kina Bank's transaction ID
      payment_url: config.sandboxMode
        ? `https://sandbox.kinabank.com.pg/payment/${transaction.merchantReference}`
        : `https://secure.kinabank.com.pg/payment/${transaction.merchantReference}`,
      merchant_reference: transaction.merchantReference,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
    };

    // Update transaction with response
    await updateTransactionStatus(transaction.merchantReference, {
      status: TRANSACTION_STATUS.PROCESSING,
      transactionReference: simulatedResponse.transaction_id,
      callbackData: { initiation_response: simulatedResponse }
    });

    return {
      success: true,
      merchantReference: transaction.merchantReference,
      paymentUrl: simulatedResponse.payment_url,
      transactionId: simulatedResponse.transaction_id,
      expiresAt: simulatedResponse.expires_at
    };

  } catch (error) {
    console.error('Kina Bank payment initiation failed:', error);
    throw new Error(`Payment initiation failed: ${error.message}`);
  }
};

/**
 * Verify Kina Bank payment status
 * NOTE: Placeholder - requires actual Kina Bank API documentation
 * @param {string} merchantReference - Our merchant reference
 * @returns {Promise<Object>} Payment verification result
 */
export const verifyKinaBankPayment = async (merchantReference) => {
  try {
    // Get transaction
    const transaction = await getTransactionByReference(merchantReference);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Get Kina Bank configuration
    const config = await getGatewayConfig(GATEWAY_NAMES.KINA_BANK);

    // TODO: Replace with actual Kina Bank API call to verify payment status
    const apiEndpoint = config.sandboxMode
      ? `https://sandbox.kinabank.com.pg/api/payment/verify/${transaction.transactionReference}`
      : `https://api.kinabank.com.pg/payment/verify/${transaction.transactionReference}`;

    console.log('Verifying payment at:', apiEndpoint);

    // Actual API call (to be implemented with Kina Bank documentation)
    // const response = await fetch(apiEndpoint, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${config.apiKey}`
    //   }
    // });
    // const result = await response.json();

    // Simulated verification response
    const verificationResult = {
      status: 'success', // or 'failed', 'pending'
      transaction_id: transaction.transactionReference,
      amount: transaction.amount,
      payment_method: 'VISA',
      card_last_four: '4242',
      payment_date: new Date().toISOString()
    };

    // Update transaction status based on verification
    const updatedTransaction = await updateTransactionStatus(merchantReference, {
      status: verificationResult.status === 'success'
        ? TRANSACTION_STATUS.SUCCESS
        : verificationResult.status === 'failed'
        ? TRANSACTION_STATUS.FAILED
        : TRANSACTION_STATUS.PROCESSING,
      callbackData: { verification_response: verificationResult }
    });

    return {
      success: verificationResult.status === 'success',
      status: verificationResult.status,
      merchantReference,
      transactionReference: transaction.transactionReference,
      amount: transaction.amount,
      paymentMethod: verificationResult.payment_method,
      cardLastFour: verificationResult.card_last_four,
      paymentDate: verificationResult.payment_date,
      transaction: updatedTransaction
    };

  } catch (error) {
    console.error('Kina Bank payment verification failed:', error);
    throw new Error(`Payment verification failed: ${error.message}`);
  }
};

/**
 * Handle Kina Bank webhook/callback
 * @param {Object} webhookData - Data from Kina Bank webhook
 * @returns {Promise<Object>} Processing result
 */
export const handleKinaBankWebhook = async (webhookData) => {
  try {
    // Log webhook receipt
    const { error: logError } = await supabase
      .from('payment_gateway_webhooks')
      .insert({
        gateway_name: GATEWAY_NAMES.KINA_BANK,
        webhook_type: 'callback',
        transaction_reference: webhookData.transaction_id,
        payload: webhookData,
        processed: false
      });

    if (logError) console.error('Failed to log webhook:', logError);

    // Extract merchant reference from webhook
    const merchantReference = webhookData.merchant_reference;

    if (!merchantReference) {
      throw new Error('No merchant reference in webhook data');
    }

    // Update transaction status
    const status = webhookData.status === 'completed' || webhookData.status === 'success'
      ? TRANSACTION_STATUS.SUCCESS
      : webhookData.status === 'failed'
      ? TRANSACTION_STATUS.FAILED
      : TRANSACTION_STATUS.PROCESSING;

    const updatedTransaction = await updateTransactionStatus(merchantReference, {
      status,
      transactionReference: webhookData.transaction_id,
      callbackData: webhookData,
      errorMessage: webhookData.error_message || null
    });

    // Mark webhook as processed
    await supabase
      .from('payment_gateway_webhooks')
      .update({ processed: true })
      .eq('transaction_reference', webhookData.transaction_id);

    return {
      success: true,
      merchantReference,
      status,
      transaction: updatedTransaction
    };

  } catch (error) {
    console.error('Webhook processing failed:', error);

    // Mark webhook as failed
    await supabase
      .from('payment_gateway_webhooks')
      .update({
        processed: false,
        processing_error: error.message
      })
      .eq('transaction_reference', webhookData.transaction_id);

    throw error;
  }
};

// =====================================================
// Generic Payment Gateway Functions
// =====================================================

/**
 * Process online payment through configured gateway
 * @param {string} gatewayName - Gateway to use
 * @param {Object} paymentData - Payment details
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Payment initiation result
 */
export const processOnlinePayment = async (gatewayName, paymentData, userId) => {
  try {
    if (gatewayName === GATEWAY_NAMES.KINA_BANK) {
      return await initiateKinaBankPayment(paymentData, userId);
    } else if (gatewayName === GATEWAY_NAMES.BSP) {
      // TODO: Implement BSP integration
      throw new Error('BSP integration not yet implemented');
    } else {
      throw new Error(`Unsupported gateway: ${gatewayName}`);
    }
  } catch (error) {
    console.error('Online payment processing failed:', error);
    throw error;
  }
};

/**
 * Verify online payment through configured gateway
 * @param {string} gatewayName - Gateway name
 * @param {string} merchantReference - Merchant reference
 * @returns {Promise<Object>} Verification result
 */
export const verifyOnlinePayment = async (gatewayName, merchantReference) => {
  try {
    if (gatewayName === GATEWAY_NAMES.KINA_BANK) {
      return await verifyKinaBankPayment(merchantReference);
    } else if (gatewayName === GATEWAY_NAMES.BSP) {
      // TODO: Implement BSP verification
      throw new Error('BSP integration not yet implemented');
    } else {
      throw new Error(`Unsupported gateway: ${gatewayName}`);
    }
  } catch (error) {
    console.error('Payment verification failed:', error);
    throw error;
  }
};

// Export constants for use in other modules
export { GATEWAY_NAMES, TRANSACTION_STATUS };
