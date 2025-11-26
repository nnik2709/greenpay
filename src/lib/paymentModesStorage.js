import { api } from './api/client';

export const getPaymentModes = async () => {
  try {
    const data = await api.paymentModes.getAll();
    return (data || []).map(mode => ({
      id: mode.id,
      name: mode.name,
      collectCardDetails: mode.collectCardDetails,
      active: mode.active,
    }));
  } catch (error) {
    console.error("Failed to get payment modes", error);
    return [];
  }
};

export const addPaymentMode = async (mode) => {
  try {
    const data = await api.paymentModes.create({
      name: mode.name,
      collectCardDetails: mode.collectCardDetails,
      active: mode.active,
    });

    return {
      id: data.id,
      name: data.name,
      collectCardDetails: data.collectCardDetails,
      active: data.active,
    };
  } catch (error) {
    console.error("Failed to add payment mode", error);
    throw error;
  }
};

export const updatePaymentMode = async (id, updates) => {
  try {
    const data = await api.paymentModes.update(id, {
      name: updates.name,
      collectCardDetails: updates.collectCardDetails,
      active: updates.active,
    });

    return {
      id: data.id,
      name: data.name,
      collectCardDetails: data.collectCardDetails,
      active: data.active,
    };
  } catch (error) {
    console.error("Failed to update payment mode", error);
    throw error;
  }
};