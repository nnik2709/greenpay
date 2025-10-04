import { supabase } from './supabaseClient';

export const getUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
};

export const getUserById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading user:', error);
    return null;
  }
};

export const createUser = async (userData) => {
  try {
    // First, create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (authError) throw authError;

    // Then create the profile
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        email: userData.email,
        role: userData.role,
        active: true,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id, updates) => {
  try {
    const updateData = {};
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.active !== undefined) updateData.active = updates.active;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deactivateUser = async (id) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw error;
  }
};

export const activateUser = async (id) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ active: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error activating user:', error);
    throw error;
  }
};
