/**
 * Stripe Payment Gateway Adapter
 *
 * FOR TESTING/POC ONLY - Replace with BSP/Kina Bank for production
 *
 * Features:
 * - Implements PaymentGatewayInterface
 * - Uses Stripe Checkout for hosted payment page
 * - Handles webhooks for async payment confirmation
 * - Test mode only (uses test API keys)
 */

const PaymentGatewayInterface = require('./PaymentGatewayInterface');

class StripeGateway extends PaymentGatewayInterface {
  constructor() {
    super();

    // Initialize Stripe SDK
    this.stripe = null;
    this.webhookSecret = null;

    if (this.isAvailable()) {
      this.stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    }
  }

  /**
   * Create Stripe Checkout Session
   */
  async createPaymentSession(params) {
    const {
      sessionId,
      customerEmail,
      customerPhone,
      quantity,
      amountPGK,
      currency = 'USD', // Use USD for testing since Stripe may not support PGK
      returnUrl,
      cancelUrl,
      metadata = {}
    } = params;

    try {
      // Convert PGK to USD for testing (Stripe doesn't support PGK)
      // In production: Use BSP/Kina Bank gateway that supports native PGK
      //
      // EXCHANGE RATE CONFIGURATION:
      // - Set PGK_TO_USD_RATE environment variable to update rate
      // - Default: 0.27 (1 PGK ≈ 0.27 USD as of Dec 2024)
      // - This rate should be updated regularly to match current market rates
      // - For production: Use live exchange rate API or local gateway
      const exchangeRate = parseFloat(process.env.PGK_TO_USD_RATE || '0.27');
      const amountUSD = Math.ceil(amountPGK * exchangeRate * 100); // Convert to cents

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd', // Stripe uses USD for international payments
              product_data: {
                name: 'PNG Green Fees Exit Pass Voucher',
                description: `${quantity} voucher(s) - PGK ${amountPGK.toFixed(2)} (converted to USD for payment)`,
              },
              unit_amount: Math.ceil((amountPGK / quantity) * exchangeRate * 100), // Convert PGK to USD cents
            },
            quantity: quantity,
          },
        ],
        mode: 'payment',
        success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        client_reference_id: sessionId, // Our internal session ID
        metadata: {
          ...metadata,
          purchase_session_id: sessionId,
          customer_phone: customerPhone,
          quantity: quantity,
          amount_pgk: amountPGK,
          exchange_rate: exchangeRate,
          gateway: 'stripe',
        },
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes (Stripe minimum)
      });

      console.log(`✅ [STRIPE] Payment session created: ${session.id} for ${sessionId}`);

      return {
        paymentUrl: session.url,
        sessionId: session.id,
        expiresAt: new Date(session.expires_at * 1000),
        metadata: {
          stripeSessionId: session.id,
          amountUSD: amountUSD / 100,
          amountPGK: amountPGK,
          exchangeRate: exchangeRate,
        },
      };
    } catch (error) {
      console.error('❌ [STRIPE] Session creation failed:', error);
      throw new Error(`Stripe payment session creation failed: ${error.message}`);
    }
  }

  /**
   * Verify Stripe Checkout Session status
   */
  async verifyPaymentSession(gatewaySessionId) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(gatewaySessionId);

      const statusMap = {
        'open': 'pending',
        'complete': 'completed',
        'expired': 'expired',
      };

      const result = {
        status: statusMap[session.status] || 'pending',
        paymentDetails: null,
      };

      if (session.status === 'complete') {
        result.paymentDetails = {
          transactionId: session.payment_intent,
          paymentMethod: 'card', // Stripe uses cards
          amount: session.amount_total / 100, // Convert from cents
          currency: session.currency.toUpperCase(),
          completedAt: new Date(session.created * 1000),
          customerEmail: session.customer_email,
          metadata: session.metadata,
        };
      }

      console.log(`✅ [STRIPE] Session verified: ${gatewaySessionId} - ${result.status}`);
      return result;
    } catch (error) {
      console.error('❌ [STRIPE] Session verification failed:', error);
      throw new Error(`Stripe session verification failed: ${error.message}`);
    }
  }

  /**
   * Verify Stripe webhook signature
   */
  verifyWebhookSignature(payload, signature, secret = null) {
    try {
      const webhookSecret = secret || this.webhookSecret;

      if (!webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
      }

      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      console.log(`✅ [STRIPE] Webhook verified: ${event.type}`);
      return event;
    } catch (error) {
      console.error('❌ [STRIPE] Webhook verification failed:', error);
      throw new Error(`Invalid webhook signature: ${error.message}`);
    }
  }

  /**
   * Process Stripe webhook event
   */
  async processWebhookEvent(event) {
    try {
      const { type, data } = event;

      // Handle different event types
      switch (type) {
        case 'checkout.session.completed': {
          const session = data.object;
          return {
            success: true,
            sessionId: session.client_reference_id, // Our internal session ID
            status: 'completed',
            data: {
              stripeSessionId: session.id,
              paymentIntentId: session.payment_intent,
              amountPaid: session.amount_total / 100,
              currency: session.currency.toUpperCase(),
              customerEmail: session.customer_email,
              metadata: session.metadata,
            },
          };
        }

        case 'checkout.session.expired': {
          const session = data.object;
          return {
            success: true,
            sessionId: session.client_reference_id,
            status: 'expired',
            data: {
              stripeSessionId: session.id,
            },
          };
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = data.object;
          return {
            success: true,
            sessionId: paymentIntent.metadata?.purchase_session_id,
            status: 'failed',
            data: {
              paymentIntentId: paymentIntent.id,
              errorMessage: paymentIntent.last_payment_error?.message,
            },
          };
        }

        default:
          console.log(`⚠️ [STRIPE] Unhandled event type: ${type}`);
          return {
            success: true,
            sessionId: null,
            status: 'ignored',
            data: { eventType: type },
          };
      }
    } catch (error) {
      console.error('❌ [STRIPE] Webhook processing failed:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(params) {
    const { transactionId, amount, reason } = params;

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: transactionId,
        amount: Math.round(amount * 100), // Convert to cents
        reason: reason || 'requested_by_customer',
      });

      console.log(`✅ [STRIPE] Refund processed: ${refund.id}`);

      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
        currency: refund.currency.toUpperCase(),
      };
    } catch (error) {
      console.error('❌ [STRIPE] Refund failed:', error);
      throw new Error(`Stripe refund failed: ${error.message}`);
    }
  }

  /**
   * Get gateway name
   */
  getName() {
    return 'stripe';
  }

  /**
   * Check if Stripe is configured
   */
  isAvailable() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secretKey || !webhookSecret) {
      console.warn('⚠️ [STRIPE] Not configured - missing API keys');
      return false;
    }

    // Verify it's a test key (for safety during POC)
    if (!secretKey.startsWith('sk_test_')) {
      console.warn('⚠️ [STRIPE] Only test keys allowed during POC phase');
      return false;
    }

    return true;
  }
}

module.exports = StripeGateway;
