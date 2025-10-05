import { supabase } from './supabaseClient';

export const getSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

    // Return default settings if none exist
    return data || {
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
    // Check if settings exist
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .maybeSingle();

    if (existing) {
      // Update existing settings
      const { data, error } = await supabase
        .from('settings')
        .update({
          voucher_validity_days: settings.voucher_validity_days,
          default_amount: settings.default_amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert new settings
      const { data, error } = await supabase
        .from('settings')
        .insert([{
          voucher_validity_days: settings.voucher_validity_days,
          default_amount: settings.default_amount,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};
