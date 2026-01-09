const path = require('path');
const fs = require('fs');

/**
 * Add Header with CCDA Logo
 *
 * Adds CCDA logo centered at top of page
 *
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {number} yPos - Starting Y position
 * @param {Object} options - Header options
 * @param {number} options.logoSize - Logo size (default: 90)
 * @param {number} options.pageWidth - Page width (default: 595.28)
 * @returns {number} New Y position after header
 */
function addHeader(doc, yPos, options = {}) {
  const {
    logoSize = 90,
    pageWidth = 595.28  // A4 width
  } = options;

  // Center the CCDA logo
  const logoX = (pageWidth - logoSize) / 2;

  // CCDA Logo (centered)
  try {
    const ccdaLogoPath = path.join(__dirname, '../../../assets/logos/ccda-logo.png');
    if (fs.existsSync(ccdaLogoPath)) {
      doc.image(ccdaLogoPath, logoX, yPos, { width: logoSize });
    }
  } catch (err) {
    console.warn('CCDA logo not found:', err.message);
  }

  return yPos + logoSize + 30; // Return position below logo
}

module.exports = { addHeader };
