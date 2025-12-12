/**
 * Centralized Voucher Configuration
 * Single source of truth for all voucher-related settings across the system
 *
 * This module defines:
 * - Barcode generation settings
 * - Voucher validity periods
 * - Voucher display settings
 * - PDF generation settings
 */

module.exports = {
  /**
   * Barcode Configuration
   * Used by: buy-online routes, voucher PDF generation, voucher display
   */
  barcode: {
    format: 'CODE128',           // Standard linear barcode format
    width: 2,                     // Bar width multiplier
    height: 60,                   // Bar height in pixels
    displayValue: true,           // Show voucher code below barcode
    fontSize: 16,                 // Font size for displayed value
    margin: 10,                   // Margin around barcode in pixels
    background: '#ffffff',        // White background
    lineColor: '#000000',         // Black bars
    canvas: {
      width: 400,                 // Canvas width for generation
      height: 120                 // Canvas height for generation
    }
  },

  /**
   * Voucher Validity Configuration
   * Used by: voucher creation, display, validation
   */
  validity: {
    durationDays: 365,            // 1 year validity
    description: '1 year',        // Human-readable description
    displayFormat: 'long'         // 'long' = "12/12/2026", 'short' = "1 year"
  },

  /**
   * Voucher Display Settings
   * Used by: frontend components, PDF generation
   */
  display: {
    codeFormat: {
      prefix: 'VCH',              // Voucher code prefix
      separator: '-',             // Separator character
      uppercase: true             // Convert to uppercase
    },
    labels: {
      scanInstruction: 'Scan barcode at gate',
      presentInstruction: 'Present this code at the gate for entry',
      validityLabel: 'Valid Until',
      codeLabel: 'Voucher Code'
    },
    styling: {
      primaryColor: '#10b981',    // Emerald-600
      secondaryColor: '#059669',  // Emerald-700
      borderColor: '#d1d5db',     // Gray-300
      backgroundColor: '#ffffff'
    }
  },

  /**
   * PDF Generation Settings
   * Used by: PDF generator utility
   */
  pdf: {
    pageSize: 'A4',
    margins: {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40
    },
    fonts: {
      header: { size: 32, weight: 'bold' },
      title: { size: 24, weight: 'bold' },
      body: { size: 14, weight: 'normal' },
      code: { size: 18, weight: 'bold', family: 'Courier' }
    },
    includeBarcode: true,
    includeQRCode: false,         // QR codes disabled, barcodes only
    watermark: false
  },

  /**
   * Voucher Types Configuration
   * Used by: voucher creation, validation, reporting
   */
  types: {
    INDIVIDUAL: {
      name: 'Individual Purchase',
      code: 'IND',
      defaultAmount: 50.00,
      currency: 'PGK',
      requiresPassport: true
    },
    CORPORATE: {
      name: 'Corporate Voucher',
      code: 'CORP',
      defaultAmount: 50.00,
      currency: 'PGK',
      requiresPassport: true,
      requiresCompany: true
    },
    ONLINE: {
      name: 'Online Purchase',
      code: 'ONL',
      defaultAmount: 50.00,
      currency: 'PGK',
      requiresPassport: true,
      autoEmail: true
    }
  },

  /**
   * Status Configuration
   * Used by: voucher lifecycle management
   */
  statuses: {
    VALID: {
      code: 'valid',
      label: '✓ VALID',
      color: '#10b981',           // Green
      canUse: true
    },
    USED: {
      code: 'used',
      label: 'USED',
      color: '#6b7280',           // Gray
      canUse: false
    },
    EXPIRED: {
      code: 'expired',
      label: 'EXPIRED',
      color: '#ef4444',           // Red
      canUse: false
    },
    CANCELLED: {
      code: 'cancelled',
      label: 'CANCELLED',
      color: '#f59e0b',           // Orange
      canUse: false
    }
  },

  /**
   * Helper Functions
   */
  helpers: {
    /**
     * Calculate valid until date from creation date
     * @param {Date} fromDate - Starting date (defaults to now)
     * @returns {Date} Valid until date
     */
    calculateValidUntil(fromDate = new Date()) {
      const date = new Date(fromDate);
      date.setDate(date.getDate() + module.exports.validity.durationDays);
      return date;
    },

    /**
     * Generate voucher code
     * @param {string} type - Voucher type code (IND, CORP, ONL)
     * @returns {string} Generated voucher code
     */
    generateVoucherCode(type = 'VCH') {
      const config = module.exports.display.codeFormat;
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const code = `${config.prefix}${config.separator}${timestamp}${config.separator}${random}`;
      return config.uppercase ? code.toUpperCase() : code;
    },

    /**
     * Validate voucher code format
     * @param {string} code - Voucher code to validate
     * @returns {boolean} True if valid format
     */
    isValidVoucherCode(code) {
      const config = module.exports.display.codeFormat;
      const pattern = new RegExp(`^${config.prefix}${config.separator}\\d+${config.separator}[A-Z0-9]+$`, 'i');
      return pattern.test(code);
    },

    /**
     * Check if voucher is expired
     * @param {Date} validUntil - Valid until date
     * @returns {boolean} True if expired
     */
    isExpired(validUntil) {
      return new Date(validUntil) < new Date();
    },

    /**
     * Get human-readable validity description
     * @returns {string} Validity description
     */
    getValidityDescription() {
      return module.exports.validity.description;
    }
  }
};
