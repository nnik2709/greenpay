import { supabase } from './supabaseClient';

export const getPaymentModes = async () => {
  try {
    const { data, error } = await supabase
      .from('payment_modes')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return data.map(mode => ({
      id: mode.id,
      name: mode.name,
      collectCardDetails: mode.collect_card_details,
      active: mode.active,
    }));
  } catch (error) {
    console.error("Failed to get payment modes from Supabase", error);
    return [];
  }
};

export const addPaymentMode = async (mode) => {
  try {
    const { data, error } = await supabase
      .from('payment_modes')
      .insert([{
        name: mode.name.toUpperCase().trim(),
        collect_card_details: mode.collectCardDetails,
        active: mode.active,
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      collectCardDetails: data.collect_card_details,
      active: data.active,
    };
  } catch (error) {
    console.error("Failed to add payment mode to Supabase", error);
    throw error;
  }
};

export const updatePaymentMode = async (id, updates) => {
  try {
    const updateData = {};
    if (updates.name !== undefined) updateData.name = updates.name.toUpperCase().trim();
    if (updates.collectCardDetails !== undefined) updateData.collect_card_details = updates.collectCardDetails;
    if (updates.active !== undefined) updateData.active = updates.active;

    const { data, error } = await supabase
      .from('payment_modes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      collectCardDetails: data.collect_card_details,
      active: data.active,
    };
  } catch (error) {
    console.error("Failed to update payment mode in Supabase", error);
    throw error;
  }
};