/**
 * Kina Bank Payment Gateway Adapter
 *
 * PLACEHOLDER - To be implemented when moving to production
 *
 * Alternative to BSP for PNG payments
 */

const PaymentGatewayInterface = require('./PaymentGatewayInterface');

class KinaBankGateway extends PaymentGatewayInterface {
  constructor() {
    super();
    this.config = {
      merchantId: process.env.KINA_MERCHANT_ID,
      apiKey: process.env.KINA_API_KEY,
      sandboxUrl: process.env.KINA_SANDBOX_URL || 'https://sandbox-kina.example.com',
      productionUrl: process.env.KINA_PRODUCTION_URL || 'https://api-kina.com.pg',
      mode: process.env.KINA_MODE || 'sandbox',
    };
  }

  async createPaymentSession(params) {
    console.log('🏦 [KINA BANK] Creating payment session (PLACEHOLDER)');

    // TODO: Implement actual Kina Bank API integration

    return {
      paymentUrl: `/mock-kina-payment?session=${params.sessionId}`,
      sessionId: `KINA-${params.sessionId}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      metadata: {
        gateway: 'kina',
        mode: 'placeholder',
      },
    };
  }

  async verifyPaymentSession(gatewaySessionId) {
    console.log('🏦 [KINA BANK] Verifying session (PLACEHOLDER):', gatewaySessionId);

    return {
      status: 'pending',
      paymentDetails: null,
    };
  }

  verifyWebhookSignature(payload, signature, secret = null) {
    console.log('🏦 [KINA BANK] Verifying webhook (PLACEHOLDER)');
    return typeof payload === 'string' ? JSON.parse(payload) : payload;
  }

  async processWebhookEvent(event) {
    console.log('🏦 [KINA BANK] Processing webhook (PLACEHOLDER)');

    return {
      success: true,
      sessionId: event.sessionId,
      status: 'completed',
      data: event,
    };
  }

  async processRefund(params) {
    console.log('🏦 [KINA BANK] Processing refund (PLACEHOLDER)');

    return {
      refundId: `KINA-REF-${Date.now()}`,
      status: 'pending',
      amount: params.amount,
      currency: 'PGK',
    };
  }

  getName() {
    return 'kina';
  }

  isAvailable() {
    if (!this.config.merchantId || !this.config.apiKey) {
      console.warn('⚠️ [KINA BANK] Not configured - missing credentials');
      return false;
    }
    return true;
  }
}

module.exports = KinaBankGateway;
