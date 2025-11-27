// PNG GST Calculation Utilities
// Papua New Guinea Goods and Services Tax (GST) is 10%

export const GST_RATE = 10.00; // PNG standard rate

/**
 * Calculate GST amount from subtotal
 * @param {number} subtotal - Amount before GST
 * @param {number} gstRate - GST rate percentage (default 10%)
 * @returns {number} GST amount
 */
export const calculateGST = (subtotal, gstRate = GST_RATE) => {
  return parseFloat((subtotal * (gstRate / 100)).toFixed(2));
};

/**
 * Calculate totals from items array
 * @param {Array} items - Array of items with quantity, unitPrice, gstApplicable
 * @param {number} gstRate - GST rate percentage (default 10%)
 * @returns {Object} { subtotal, gst, total }
 */
export const calculateTotals = (items, gstRate = GST_RATE) => {
  if (!items || !Array.isArray(items)) {
    return { subtotal: 0, gst: 0, total: 0 };
  }

  const subtotal = items.reduce((sum, item) => {
    const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
    return sum + (item.gstApplicable !== false ? itemTotal : 0);
  }, 0);

  const gst = calculateGST(subtotal, gstRate);
  const total = subtotal + gst;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    gst: parseFloat(gst.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
};

/**
 * Extract subtotal from total (reverse GST calculation)
 * @param {number} totalIncGST - Total amount including GST
 * @param {number} gstRate - GST rate percentage (default 10%)
 * @returns {number} Subtotal (amount before GST)
 */
export const extractSubtotal = (totalIncGST, gstRate = GST_RATE) => {
  return parseFloat((totalIncGST / (1 + gstRate / 100)).toFixed(2));
};

/**
 * Format amount as PNG Kina currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string (e.g., "K 1,234.56")
 */
export const formatPGK = (amount) => {
  if (amount === null || amount === undefined) return 'K 0.00';

  return `K ${parseFloat(amount).toLocaleString('en-PG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Generate document number in format PREFIX-YYYYMM-XXXX
 * @param {string} prefix - Document prefix (QTN, INV, GP)
 * @param {number} sequenceNumber - Sequential number
 * @returns {string} Formatted document number
 */
export const generateDocNumber = (prefix, sequenceNumber) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const yearMonth = `${year}${month}`;
  const paddedNumber = String(sequenceNumber).padStart(4, '0');

  return `${prefix}-${yearMonth}-${paddedNumber}`;
};

/**
 * Calculate invoice due date
 * @param {Date|string} invoiceDate - Invoice date
 * @param {number} dueDays - Number of days until due (default 30)
 * @returns {Date} Due date
 */
export const calculateDueDate = (invoiceDate, dueDays = 30) => {
  const date = new Date(invoiceDate);
  date.setDate(date.getDate() + dueDays);
  return date;
};

/**
 * Check if invoice is overdue
 * @param {Date|string} dueDate - Invoice due date
 * @param {string} status - Invoice status
 * @returns {boolean} True if overdue
 */
export const isOverdue = (dueDate, status) => {
  if (status === 'paid' || status === 'cancelled') return false;
  return new Date(dueDate) < new Date();
};

/**
 * Calculate payment progress percentage
 * @param {number} amountPaid - Amount paid so far
 * @param {number} totalAmount - Total invoice amount
 * @returns {number} Percentage (0-100)
 */
export const calculatePaymentProgress = (amountPaid, totalAmount) => {
  if (!totalAmount || totalAmount === 0) return 0;
  return Math.min(100, Math.round((amountPaid / totalAmount) * 100));
};

/**
 * Format payment terms
 * @param {number} days - Number of days
 * @returns {string} Payment terms string
 */
export const formatPaymentTerms = (days) => {
  if (days === 0) return 'Due on receipt';
  if (days === 7) return 'Net 7 days';
  if (days === 14) return 'Net 14 days';
  if (days === 30) return 'Net 30 days';
  if (days === 60) return 'Net 60 days';
  if (days === 90) return 'Net 90 days';
  return `Net ${days} days`;
};

/**
 * Validate TIN format (PNG Tax Identification Number)
 * @param {string} tin - TIN to validate
 * @returns {boolean} True if valid format
 */
export const validateTIN = (tin) => {
  if (!tin) return true; // Optional field
  // PNG TIN format: 9 digits
  return /^\d{9}$/.test(tin.replace(/[^0-9]/g, ''));
};

/**
 * Format TIN for display
 * @param {string} tin - TIN to format
 * @returns {string} Formatted TIN (XXX-XXX-XXX)
 */
export const formatTIN = (tin) => {
  if (!tin) return '';
  const cleaned = tin.replace(/[^0-9]/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6, 9)}`;
  }
  return cleaned;
};

/**
 * Get status badge color class
 * @param {string} status - Invoice status
 * @returns {string} Tailwind CSS classes for badge
 */
export const getStatusBadgeClass = (status) => {
  const classes = {
    'pending': 'bg-yellow-100 text-yellow-700',
    'partial': 'bg-blue-100 text-blue-700',
    'paid': 'bg-green-100 text-green-700',
    'overdue': 'bg-red-100 text-red-700',
    'cancelled': 'bg-gray-100 text-gray-700'
  };
  return classes[status] || 'bg-gray-100 text-gray-700';
};

/**
 * Get status display text
 * @param {string} status - Invoice status
 * @returns {string} Display text
 */
export const getStatusText = (status) => {
  const text = {
    'pending': 'Pending',
    'partial': 'Partial Payment',
    'paid': 'Paid',
    'overdue': 'Overdue',
    'cancelled': 'Cancelled'
  };
  return text[status] || status;
};

/**
 * Calculate green pass validity (1 year from issue)
 * @param {Date|string} issueDate - Issue date
 * @returns {Date} Valid until date
 */
export const calculateGreenPassValidity = (issueDate) => {
  const date = new Date(issueDate);
  date.setFullYear(date.getFullYear() + 1);
  return date;
};
