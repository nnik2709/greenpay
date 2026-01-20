import api from './api/client';

// Role name to ID mapping (matches production database Role table)
// Verified from production: SELECT id, name FROM "Role" ORDER BY id;
const ROLE_MAP = {
  'Flex_Admin': 6,
  'Finance_Manager': 7,
  'Counter_Agent': 8,
  'IT_Support': 5
};

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
    // Map role name to roleId for backend
    const roleId = ROLE_MAP[userData.role];

    if (!roleId) {
      throw new Error(`Invalid role: ${userData.role}`);
    }

    // Create user via API - backend expects roleId (integer)
    const payload = {
      email: userData.email,
      password: userData.password,
      roleId: roleId, // Backend expects roleId, not role
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

    // Handle role mapping: if role name is provided, convert to roleId
    if (updates.role !== undefined) {
      const roleId = ROLE_MAP[updates.role];
      if (!roleId) {
        throw new Error(`Invalid role: ${updates.role}`);
      }
      updateData.roleId = roleId;
    }

    if (updates.roleId !== undefined) updateData.roleId = updates.roleId;
    if (updates.active !== undefined) updateData.isActive = updates.active; // Backend expects isActive
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.name !== undefined) updateData.name = updates.name;

    // Handle password updates
    if (updates.password !== undefined) updateData.password = updates.password;

    const response = await api.users.update(id, updateData);
    return response.user || response.data || response;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deactivateUser = async (id) => {
  try {
    const response = await api.users.update(id, { isActive: false }); // Changed from 'active' to 'isActive'
    return response.user || response.data || response;
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw error;
  }
};

export const activateUser = async (id) => {
  try {
    const response = await api.users.update(id, { isActive: true }); // Changed from 'active' to 'isActive'
    return response.user || response.data || response;
  } catch (error) {
    console.error('Error activating user:', error);
    throw error;
  }
};
