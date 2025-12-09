
/**
 * SMS Service
 * Handles SMS notifications for vouchers and alerts
 */

/**
 * Get SMS settings from database
 * @returns {Promise<Object>} SMS configuration
 */
export const getSMSSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('sms_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error;
    }

    // Return default settings if none exist
    return data || {
      enabled: false,
      provider: 'twilio',
      api_key: '',
      api_secret: '',
      sender_id: 'PNG Green Fees',
      send_on_voucher_generation: false,
      send_on_expiry_reminder: false,
      expiry_reminder_days: 3,
    };
  } catch (error) {
    console.error('Error fetching SMS settings:', error);
    throw error;
  }
};

/**
 * Update SMS settings
 * @param {Object} settings - SMS configuration
 * @returns {Promise<Object>} Updated settings
 */
export const updateSMSSettings = async (settings) => {
  try {
    const { data, error } = await supabase
      .from('sms_settings')
      .upsert({
        id: 1, // Single row config
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating SMS settings:', error);
    throw error;
  }
};

/**
 * Send SMS via Supabase Edge Function
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} Send result
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        to: phoneNumber,
        message: message,
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

/**
 * Send voucher SMS to passenger
 * @param {Object} voucherData - Voucher information
 * @param {string} phoneNumber - Recipient phone number
 * @returns {Promise<Object>} Send result
 */
export const sendVoucherSMS = async (voucherData, phoneNumber) => {
  const message = `PNG Green Fees: Your exit pass voucher ${voucherData.voucher_code} is ready. Valid until ${new Date(voucherData.valid_until).toLocaleDateString()}. Amount: PGK ${voucherData.amount}. Safe travels!`;

  return sendSMS(phoneNumber, message);
};

/**
 * Send expiry reminder SMS
 * @param {Object} voucherData - Voucher information
 * @param {string} phoneNumber - Recipient phone number
 * @param {number} daysUntilExpiry - Days until expiry
 * @returns {Promise<Object>} Send result
 */
export const sendExpiryReminderSMS = async (voucherData, phoneNumber, daysUntilExpiry) => {
  const message = `PNG Green Fees: Your voucher ${voucherData.voucher_code} expires in ${daysUntilExpiry} days (${new Date(voucherData.valid_until).toLocaleDateString()}). Please use before expiry.`;

  return sendSMS(phoneNumber, message);
};

/**
 * Test SMS sending with a test message
 * @param {string} phoneNumber - Test recipient
 * @returns {Promise<Object>} Test result
 */
export const sendTestSMS = async (phoneNumber) => {
  const message = 'PNG Green Fees: This is a test message. SMS notifications are working correctly.';
  return sendSMS(phoneNumber, message);
};

/**
 * Validate PNG phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid
 */
export const validatePNGPhoneNumber = (phoneNumber) => {
  // PNG phone numbers: +675 followed by 7-8 digits
  const pngPhoneRegex = /^\+675\d{7,8}$/;
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  return pngPhoneRegex.test(cleaned);
};

/**
 * Format phone number to PNG standard
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPNGPhoneNumber = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('675')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('+675')) {
    return cleaned;
  }
  return '+675' + cleaned;
};
