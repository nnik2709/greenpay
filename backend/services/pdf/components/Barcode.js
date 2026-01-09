const bwipjs = require('bwip-js');

/**
 * Generate CODE128 Barcode
 *
 * @param {string} code - Code to encode
 * @param {number} width - Barcode width in pixels (default: 300)
 * @param {number} height - Barcode height in pixels (default: 80)
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateBarcode(code, width = 300, height = 80) {
  try {
    const png = await bwipjs.toBuffer({
      bcid: 'code128',        // Barcode type
      text: code,             // Text to encode
      scale: 3,               // Scaling factor
      height: height / 3,     // Bar height (in mm)
      includetext: true,      // Show human-readable text
      textxalign: 'center'    // Center text alignment
    });
    return png;
  } catch (err) {
    console.error('Barcode generation failed:', err);
    throw new Error(`Failed to generate barcode for: ${code}`);
  }
}

module.exports = { generateBarcode };
