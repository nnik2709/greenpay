/**
 * Feature Flags Configuration
 *
 * Controls feature availability without code changes.
 * Can be toggled instantly for rollback or A/B testing.
 */

export const FEATURE_FLAGS = {
  /**
   * Batch Purchase Feature
   * Allows Counter Agents to process 1-5 vouchers in single transaction
   *
   * DEFAULT: true (enabled)
   * ROLLBACK: Set to false to instantly disable batch mode
   */
  BATCH_PURCHASE_ENABLED: true,

  /**
   * Maximum vouchers per batch transaction
   * Must match backend validation (5 vouchers max)
   */
  BATCH_PURCHASE_MAX_QUANTITY: 5,

  /**
   * Minimum vouchers to activate batch mode
   * When quantity <= this value, use single purchase flow
   */
  BATCH_PURCHASE_MIN_QUANTITY: 2,
};

/**
 * Helper function to check if feature is enabled
 * @param {string} featureName - Name of the feature flag
 * @returns {boolean}
 */
export function isFeatureEnabled(featureName) {
  return FEATURE_FLAGS[featureName] === true;
}

/**
 * Get feature flag value
 * @param {string} featureName - Name of the feature flag
 * @param {*} defaultValue - Default value if flag not found
 * @returns {*}
 */
export function getFeatureValue(featureName, defaultValue = null) {
  return FEATURE_FLAGS[featureName] ?? defaultValue;
}

export default FEATURE_FLAGS;
