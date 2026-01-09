/**
 * Cloudflare Turnstile Verification
 *
 * Verifies Turnstile tokens from frontend to prevent bot attacks
 */

/**
 * Verify Cloudflare Turnstile token
 *
 * @param {string} token - Turnstile token from frontend
 * @param {string} userIP - User's IP address
 * @returns {Promise<boolean>} - True if verification passed
 */
async function verifyTurnstile(token, userIP) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.warn('⚠️ TURNSTILE_SECRET_KEY not configured, skipping verification');
    return true; // Allow in development if not configured
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    formData.append('remoteip', userIP);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Turnstile verification passed');
      return true;
    } else {
      console.warn('❌ Turnstile verification failed:', data['error-codes']);
      return false;
    }
  } catch (error) {
    console.error('❌ Turnstile verification error:', error.message);
    return false;
  }
}

module.exports = { verifyTurnstile };
