/**
 * Centralized Voucher Configuration - Frontend
 * Mirrors backend configuration for consistency
 *
 * This module defines:
 * - Barcode display settings
 * - Voucher validity display
 * - UI labels and styling
 * - Component styling
 */

export const voucherConfig = {
  /**
   * Barcode Display Configuration
   * Used by: VoucherPrint, PassportVoucherReceipt, PaymentSuccess
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
    // Display settings
    className: 'border-2 border-gray-200 rounded p-2 bg-white',
    containerClass: 'flex flex-col items-center space-y-3',
    imageClass: 'w-full max-w-[300px] h-auto'
  },

  /**
   * Voucher Validity Configuration
   * Used by: voucher display, form creation
   */
  validity: {
    durationDays: 365,            // 1 year validity
    description: '1 year',        // Human-readable description
    fallbackText: '1 year',       // Fallback display text
  },

  /**
   * Voucher Display Settings
   * Used by: All voucher display components
   */
  display: {
    labels: {
      scanInstruction: 'Scan barcode at gate',
      presentInstruction: 'Present this code at the gate for entry',
      validityLabel: 'Valid Until',
      codeLabel: 'Voucher Code',
      statusValid: '✓ VALID'
    },
    styling: {
      primaryColor: '#10b981',    // Emerald-600 (green)
      primaryColorDark: '#059669', // Emerald-700
      secondaryColor: '#2c5530',  // Dark green
      borderColor: '#d1d5db',     // Gray-300
      backgroundColor: '#ffffff',
      // Tailwind classes
      primaryClass: 'text-emerald-600 bg-emerald-600',
      primaryDarkClass: 'text-emerald-700 bg-emerald-700',
      secondaryClass: 'text-green-800 bg-green-800',
      borderClass: 'border-gray-200',
      validBadgeClass: 'inline-block px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-bold'
    }
  },

  /**
   * Component Layout Settings
   * Used by: VoucherPrint, PassportVoucherReceipt
   */
  layout: {
    voucher: {
      maxWidth: '800px',
      padding: '40px',
      borderWidth: '2px',
      borderColor: '#ccc'
    },
    receipt: {
      maxWidth: '400px',
      padding: '20px',
      borderWidth: '3px',
      borderColor: '#2c5530'
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
      date.setDate(date.getDate() + voucherConfig.validity.durationDays);
      return date;
    },

    /**
     * Format date for display
     * @param {Date|string} date - Date to format
     * @returns {string} Formatted date
     */
    formatDate(date) {
      if (!date) return voucherConfig.validity.fallbackText;
      return new Date(date).toLocaleDateString();
    },

    /**
     * Check if voucher is expired
     * @param {Date|string} validUntil - Valid until date
     * @returns {boolean} True if expired
     */
    isExpired(validUntil) {
      return new Date(validUntil) < new Date();
    },

    /**
     * Get validity description
     * @returns {string} Validity description
     */
    getValidityDescription() {
      return voucherConfig.validity.description;
    },

    /**
     * Generate barcode options for JsBarcode
     * @param {string} code - Voucher code
     * @returns {object} JsBarcode options
     */
    getBarcodeOptions() {
      return {
        format: voucherConfig.barcode.format,
        width: voucherConfig.barcode.width,
        height: voucherConfig.barcode.height,
        displayValue: voucherConfig.barcode.displayValue,
        fontSize: voucherConfig.barcode.fontSize,
        margin: voucherConfig.barcode.margin,
        background: voucherConfig.barcode.background,
        lineColor: voucherConfig.barcode.lineColor
      };
    }
  }
};

export default voucherConfig;
