const PAYMENT_MODES_KEY = 'paymentModes';

const defaultPaymentModes = [
  { id: '1', name: 'CASH', collectCardDetails: false, active: true },
  { id: '2', name: 'CREDIT CARD', collectCardDetails: true, active: true },
  { id: '3', name: 'BANK TRANSFER', collectCardDetails: false, active: false },
];

export const getPaymentModes = () => {
  try {
    const storedModes = localStorage.getItem(PAYMENT_MODES_KEY);
    if (storedModes) {
      return JSON.parse(storedModes);
    } else {
      localStorage.setItem(PAYMENT_MODES_KEY, JSON.stringify(defaultPaymentModes));
      return defaultPaymentModes;
    }
  } catch (error) {
    console.error("Failed to get payment modes from localStorage", error);
    return defaultPaymentModes;
  }
};

export const addPaymentMode = (mode) => {
  try {
    const modes = getPaymentModes();
    const newMode = {
      id: new Date().toISOString(),
      name: mode.name.toUpperCase().trim(),
      collectCardDetails: mode.collectCardDetails,
      active: mode.active,
    };
    const updatedModes = [...modes, newMode];
    localStorage.setItem(PAYMENT_MODES_KEY, JSON.stringify(updatedModes));
    return newMode;
  } catch (error) {
    console.error("Failed to add payment mode to localStorage", error);
  }
};

export const updatePaymentMode = (id, updates) => {
  try {
    const modes = getPaymentModes();
    const updatedModes = modes.map(mode =>
      mode.id === id ? { ...mode, ...updates } : mode
    );
    localStorage.setItem(PAYMENT_MODES_KEY, JSON.stringify(updatedModes));
  } catch (error) {
    console.error("Failed to update payment mode in localStorage", error);
  }
};