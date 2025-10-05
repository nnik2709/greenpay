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

    // Non-blocking notifications: welcome_user to the new user and admin alert
    try {
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com';
      const toUser = userData.email;

      // Send welcome email with magic link guidance (do not send plain password)
      await supabase.functions.invoke('send-email', {
        body: {
          to: toUser,
          templateId: 'welcome_user',
          subject: 'Welcome to PNG Green Fees',
          html: `<p>Your account has been created.</p><p>Please use the password reset link on the login page to set a secure password.</p>`
        }
      });

      // Admin notification
      if (adminEmail && adminEmail !== 'admin@example.com') {
        await supabase.functions.invoke('send-email', {
          body: {
            to: adminEmail,
            templateId: 'new_user_notification',
            subject: 'New User Created',
            html: `<p>A new user has been created.</p><p><strong>Email:</strong> ${toUser}<br/><strong>Role:</strong> ${userData.role}</p>`
          }
        });
      }
    } catch (e) {
      // ignore email errors in user creation flow
    }

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
