import { supabase } from './supabaseClient';

/**
 * Passport Service
 * Handles CRUD operations for passport records
 */

/**
 * Get passport by ID
 * @param {string} id - Passport ID
 * @returns {Promise<Object>}
 */
export async function getPassportById(id) {
  try {
    const { data, error } = await supabase
      .from('passports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching passport:', error);
    throw error;
  }
}

/**
 * Get all passports with optional filtering
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>}
 */
export async function getPassports(filters = {}) {
  try {
    let query = supabase
      .from('passports')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.passport_number) {
      query = query.ilike('passport_number', `%${filters.passport_number}%`);
    }
    if (filters.surname) {
      query = query.ilike('surname', `%${filters.surname}%`);
    }
    if (filters.nationality) {
      query = query.eq('nationality', filters.nationality);
    }
    if (filters.from_date) {
      query = query.gte('created_at', filters.from_date);
    }
    if (filters.to_date) {
      query = query.lte('created_at', filters.to_date);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching passports:', error);
    throw error;
  }
}

/**
 * Create new passport
 * @param {Object} passportData - Passport data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function createPassport(passportData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('passports')
      .insert([{
        ...passportData,
        created_by: user.id
      }])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error creating passport:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update existing passport
 * @param {string} id - Passport ID
 * @param {Object} passportData - Updated passport data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function updatePassport(id, passportData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Add audit fields
    const updateData = {
      ...passportData,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    };

    const { data, error } = await supabase
      .from('passports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Create audit log entry (if audit_logs table exists)
    try {
      await supabase
        .from('audit_logs')
        .insert([{
          table_name: 'passports',
          record_id: id,
          action: 'UPDATE',
          old_values: null, // Could fetch old values if needed
          new_values: updateData,
          user_id: user.id
        }]);
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
      // Don't fail the update if audit logging fails
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating passport:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete passport
 * @param {string} id - Passport ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deletePassport(id) {
  try {
    const { error } = await supabase
      .from('passports')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting passport:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Search passports by passport number
 * @param {string} passportNumber - Passport number to search
 * @returns {Promise<Object|null>}
 */
export async function searchPassportByNumber(passportNumber) {
  try {
    const { data, error } = await supabase
      .from('passports')
      .select('*')
      .eq('passport_number', passportNumber.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error searching passport:', error);
    throw error;
  }
}

/**
 * Check if passport number already exists
 * @param {string} passportNumber - Passport number to check
 * @param {string} excludeId - ID to exclude from check (for updates)
 * @returns {Promise<boolean>}
 */
export async function passportNumberExists(passportNumber, excludeId = null) {
  try {
    let query = supabase
      .from('passports')
      .select('id')
      .eq('passport_number', passportNumber.toUpperCase());

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking passport number:', error);
    return false;
  }
}









