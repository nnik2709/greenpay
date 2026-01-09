const colors = require('../styles/colors');

/**
 * Add Footer to PDF
 *
 * Adds standard footer with contact information
 *
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {Object} options - Footer options
 * @param {number} options.pageWidth - Page width (default: 595.28)
 * @param {number} options.pageHeight - Page height (default: 841.89)
 * @param {number} options.margin - Page margin (default: 60)
 */
function addFooter(doc, options = {}) {
  const {
    pageWidth = 595.28,
    pageHeight = 841.89,
    margin = 60
  } = options;

  const footerY = pageHeight - margin - 40;

  doc.fontSize(9)
     .fillColor(colors.TEXT_LIGHT)
     .text(
       'PNG Green Fees System | Ministry of Environment & Climate Change',
       margin,
       footerY,
       { width: pageWidth - (margin * 2), align: 'center' }
     );

  doc.text(
    'For inquiries: greenfees@environment.gov.pg | www.pnggreenfees.gov.pg',
    margin,
    footerY + 12,
    { width: pageWidth - (margin * 2), align: 'center' }
  );
}

module.exports = { addFooter };
