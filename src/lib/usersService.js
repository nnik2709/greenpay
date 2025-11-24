import api from './api/client';

export const getUsers = async () => {
  try {
    const response = await api.users.getAll();
    const data = response.users || response.data || response;
    return data || [];
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
};

export const getUserById = async (id) => {
  try {
    const response = await api.users.getById(id);
    return response.user || response.data || response;
  } catch (error) {
    console.error('Error loading user:', error);
    return null;
  }
};

export const createUser = async (userData) => {
  try {
    // Create user via API - backend will handle user creation and role assignment
    const payload = {
      email: userData.email,
      password: userData.password,
      role: userData.role,
      name: userData.name || userData.email.split('@')[0],
    };

    const response = await api.auth.register(payload);
    return response.user || response.data || response;
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
    if (updates.name !== undefined) updateData.name = updates.name;

    const response = await api.users.update(id, updateData);
    return response.user || response.data || response;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deactivateUser = async (id) => {
  try {
    const response = await api.users.update(id, { active: false });
    return response.user || response.data || response;
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw error;
  }
};

export const activateUser = async (id) => {
  try {
    const response = await api.users.update(id, { active: true });
    return response.user || response.data || response;
  } catch (error) {
    console.error('Error activating user:', error);
    throw error;
  }
};
