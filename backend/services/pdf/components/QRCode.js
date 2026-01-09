const QRCode = require('qrcode');

/**
 * Generate QR Code
 *
 * @param {string} text - Text to encode in QR code
 * @param {number} width - QR code width in pixels (default: 200)
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateQRCode(text, width = 200) {
  try {
    const qrBuffer = await QRCode.toBuffer(text, {
      width,
      margin: 1,
      errorCorrectionLevel: 'M',
      type: 'png'
    });
    return qrBuffer;
  } catch (err) {
    console.error('QR code generation failed:', err);
    throw new Error(`Failed to generate QR code for: ${text}`);
  }
}

module.exports = { generateQRCode };
