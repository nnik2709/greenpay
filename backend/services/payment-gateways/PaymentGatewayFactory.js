/**
 * Payment Gateway Factory
 *
 * Centralized factory for creating payment gateway instances.
 * Supports switching between gateways via environment configuration.
 *
 * Configuration:
 * PAYMENT_GATEWAY=stripe|bsp|kina (in .env)
 *
 * Usage:
 * const gateway = PaymentGatewayFactory.getGateway();
 * const session = await gateway.createPaymentSession(...);
 */

const StripeGateway = require('./StripeGateway');
const BSPGateway = require('./BSPGateway');
const KinaBankGateway = require('./KinaBankGateway');

class PaymentGatewayFactory {
  static gatewayInstances = {};

  /**
   * Get the active payment gateway instance
   *
   * @param {string} gatewayName - Optional: Force specific gateway (stripe, bsp, kina)
   * @returns {PaymentGatewayInterface} Gateway instance
   */
  static getGateway(gatewayName = null) {
    const activeGateway = gatewayName || process.env.PAYMENT_GATEWAY || 'stripe';

    // Return cached instance if available
    if (this.gatewayInstances[activeGateway]) {
      return this.gatewayInstances[activeGateway];
    }

    // Create new instance
    let gateway;
    switch (activeGateway.toLowerCase()) {
      case 'stripe':
        gateway = new StripeGateway();
        break;

      case 'bsp':
        gateway = new BSPGateway();
        break;

      case 'kina':
      case 'kinabank':
        gateway = new KinaBankGateway();
        break;

      default:
        throw new Error(`Unknown payment gateway: ${activeGateway}`);
    }

    // Verify gateway is available
    if (!gateway.isAvailable()) {
      console.error(`❌ Payment gateway '${activeGateway}' is not available/configured`);
      throw new Error(`Payment gateway '${activeGateway}' is not properly configured. Check environment variables.`);
    }

    // Cache and return
    this.gatewayInstances[activeGateway] = gateway;
    console.log(`✅ Payment gateway initialized: ${gateway.getName()}`);

    return gateway;
  }

  /**
   * Get all available gateways
   * @returns {Array<string>} List of configured gateway names
   */
  static getAvailableGateways() {
    const gateways = [
      { name: 'stripe', instance: new StripeGateway() },
      { name: 'bsp', instance: new BSPGateway() },
      { name: 'kina', instance: new KinaBankGateway() },
    ];

    return gateways
      .filter(g => g.instance.isAvailable())
      .map(g => g.name);
  }

  /**
   * Clear cached instances (useful for testing)
   */
  static clearCache() {
    this.gatewayInstances = {};
  }

  /**
   * Get gateway by name without caching (useful for testing)
   */
  static createGateway(gatewayName) {
    switch (gatewayName.toLowerCase()) {
      case 'stripe':
        return new StripeGateway();
      case 'bsp':
        return new BSPGateway();
      case 'kina':
      case 'kinabank':
        return new KinaBankGateway();
      default:
        throw new Error(`Unknown payment gateway: ${gatewayName}`);
    }
  }
}

module.exports = PaymentGatewayFactory;
