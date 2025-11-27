import api from './api/client';

export const getSettings = async () => {
  try {
    const response = await api.settings.get();
    return response.settings || {
      voucher_validity_days: 30,
      default_amount: 50,
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      voucher_validity_days: 30,
      default_amount: 50,
    };
  }
};

export const updateSettings = async (settings) => {
  try {
    const response = await api.settings.update({
      voucher_validity_days: settings.voucher_validity_days,
      default_amount: settings.default_amount,
    });
    return response.settings;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};
