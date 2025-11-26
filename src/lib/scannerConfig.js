/**
 * Scanner Configuration
 *
 * Centralized configuration for hardware scanner settings.
 * Adjust these values based on your specific scanner hardware.
 *
 * When you receive your hardware scanners:
 * 1. Test the scan output in a text editor
 * 2. Measure the time between characters
 * 3. Check for prefix/suffix characters
 * 4. Update the config below accordingly
 */

/**
 * Default scanner configuration
 * These values work with most USB keyboard wedge scanners
 */
export const DEFAULT_SCANNER_CONFIG = {
  // Timing settings
  scanTimeout: 100,          // Max ms between keystrokes (100ms = very fast typing)
  minLength: 5,              // Minimum characters to consider valid scan

  // MRZ settings
  enableMrzParsing: true,    // Auto-parse passport MRZ format
  mrzLength: 88,             // Standard passport MRZ length (2 lines × 44 chars)

  // Scanner behavior
  enterKeySubmits: true,     // Some scanners auto-press Enter after scan
  autoSubmit: true,          // Auto-submit on scan complete
  preventManualInput: false, // Set true to only accept scanner input (reject slow typing)

  // Optional prefix/suffix characters
  prefixChars: '',           // Characters to strip from beginning (e.g., ']C1' for some scanners)
  suffixChars: '',           // Characters to strip from end

  // Debugging
  debugMode: false,          // Enable console logging (set to true during testing)

  // Sound/haptic feedback
  enableBeep: true,          // Play beep sound on successful scan
  enableVibration: true,     // Vibrate on mobile devices (if supported)
  beepFrequency: 800,        // Beep frequency in Hz
  beepDuration: 0.2,         // Beep duration in seconds
  vibrationDuration: 200,    // Vibration duration in ms
};

/**
 * Scanner profiles for different hardware models
 * Add your scanner model here once you know the specs
 */
export const SCANNER_PROFILES = {
  // Generic USB keyboard wedge scanner
  generic: {
    ...DEFAULT_SCANNER_CONFIG,
    name: 'Generic USB Scanner',
    description: 'Default settings for most USB keyboard wedge scanners'
  },

  // Fast professional scanners (e.g., Honeywell, Zebra, Datalogic)
  professional: {
    ...DEFAULT_SCANNER_CONFIG,
    scanTimeout: 50,         // Professional scanners are faster
    name: 'Professional Scanner',
    description: 'High-speed professional barcode/MRZ scanners'
  },

  // Slower budget scanners
  budget: {
    ...DEFAULT_SCANNER_CONFIG,
    scanTimeout: 150,        // Budget scanners may be slower
    name: 'Budget Scanner',
    description: 'Entry-level USB scanners'
  },

  // Bluetooth scanners (may have slight delay)
  bluetooth: {
    ...DEFAULT_SCANNER_CONFIG,
    scanTimeout: 120,        // Account for Bluetooth latency
    name: 'Bluetooth Scanner',
    description: 'Wireless Bluetooth keyboard wedge scanners'
  },

  // Manual testing profile (very permissive)
  testing: {
    ...DEFAULT_SCANNER_CONFIG,
    scanTimeout: 300,        // Allow slower typing for testing
    minLength: 3,
    debugMode: true,         // Enable debug logging
    preventManualInput: false,
    name: 'Testing Profile',
    description: 'Permissive settings for manual testing'
  },

  // PrehKeyTec MC 147 A S (Professional MRZ Scanner)
  prehkeytec: {
    ...DEFAULT_SCANNER_CONFIG,
    scanTimeout: 60,         // PrehKeyTec is very fast (30-50ms between chars)
    enterKeySubmits: true,   // Usually configured to send Enter after scan
    prefixChars: '',         // Check if your unit adds prefix
    suffixChars: '',         // Check if your unit adds suffix
    name: 'PrehKeyTec MC 147 A S',
    description: 'Professional MRZ/Barcode scanner with autodetect'
  }
};

/**
 * Get scanner configuration by profile name
 * @param {string} profileName - Profile name (generic, professional, budget, bluetooth, testing, prehkeytec)
 * @returns {Object} Scanner configuration
 */
export const getScannerConfig = (profileName = 'generic') => {
  return SCANNER_PROFILES[profileName] || SCANNER_PROFILES.generic;
};

/**
 * Create custom scanner configuration
 * @param {Object} overrides - Custom settings to override defaults
 * @returns {Object} Scanner configuration
 */
export const createScannerConfig = (overrides = {}) => {
  return {
    ...DEFAULT_SCANNER_CONFIG,
    ...overrides
  };
};

/**
 * Scanner device information
 * Update this when you know your hardware model
 */
export const SCANNER_HARDWARE_INFO = {
  passport: {
    model: 'PrehKeyTec MC 147 A S Autodetect',
    type: 'USB Keyboard Wedge',
    manufacturer: 'PrehKeyTec (Germany)',
    capabilities: ['MRZ', '1D Barcode', '2D Barcode', 'QR Code'],
    scanSpeed: '30-50ms between characters',
    notes: 'High-quality professional scanner with automatic format detection'
  },

  qrCode: {
    model: 'PrehKeyTec MC 147 A S',
    type: 'USB Keyboard Wedge',
    capabilities: ['QR Code', '1D Barcode', '2D Barcode', 'MRZ'],
    notes: 'Same unit handles both MRZ and QR/Barcode scanning'
  }
};

/**
 * Validate scanner configuration
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result
 */
export const validateScannerConfig = (config) => {
  const errors = [];

  if (config.scanTimeout < 10 || config.scanTimeout > 1000) {
    errors.push('scanTimeout must be between 10 and 1000ms');
  }

  if (config.minLength < 1 || config.minLength > 100) {
    errors.push('minLength must be between 1 and 100');
  }

  if (config.mrzLength !== 88) {
    errors.push('mrzLength should be 88 for standard passports');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export default {
  DEFAULT_SCANNER_CONFIG,
  SCANNER_PROFILES,
  getScannerConfig,
  createScannerConfig,
  SCANNER_HARDWARE_INFO,
  validateScannerConfig
};
