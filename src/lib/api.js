/**
 * GreenPay API Client - Replaces Supabase
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://greenpay.eywademo.cloud/api';

// Get auth token from localStorage
const getToken = () => localStorage.getItem('greenpay_token');

// Set auth token
const setToken = (token) => localStorage.setItem('greenpay_token', token);

// Remove auth token
const removeToken = () => localStorage.removeItem('greenpay_token');

// Base fetch wrapper
const fetchAPI = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// API Client
export const api = {
  // Auth
  auth: {
    register: async (data) => {
      const result = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (result.token) setToken(result.token);
      return result;
    },
    
    login: async (email, password) => {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.token) setToken(data.token);
      return data;
    },
    
    logout: async () => {
      try {
        await fetchAPI('/auth/logout', { method: 'POST' });
      } finally {
        removeToken();
      }
    },
    
    getCurrentUser: () => fetchAPI('/auth/me'),
    
    changePassword: (currentPassword, newPassword) => fetchAPI('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  },

  // Users
  users: {
    getAll: (params = {}) => fetchAPI(`/users?${new URLSearchParams(params)}`),
    getById: (id) => fetchAPI(`/users/${id}`),
    update: (id, data) => fetchAPI(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    updateProfile: (id, data) => fetchAPI(`/users/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/users/${id}`, { method: 'DELETE' }),
    getRoles: () => fetchAPI('/users/roles/all'),
  },

  // Passports
  passports: {
    getAll: (params = {}) => fetchAPI(`/passports?${new URLSearchParams(params)}`),
    getById: (id) => fetchAPI(`/passports/${id}`),
    create: (data) => fetchAPI('/passports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => fetchAPI(`/passports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/passports/${id}`, { method: 'DELETE' }),
  },

  // Vouchers
  vouchers: {
    getAll: (params = {}) => fetchAPI(`/vouchers?${new URLSearchParams(params)}`),
    getByCode: (code) => fetchAPI(`/vouchers/code/${code}`),
    redeem: (code, redeemedBy) => fetchAPI(`/vouchers/redeem/${code}`, {
      method: 'POST',
      body: JSON.stringify({ redeemed_by: redeemedBy }),
    }),
  },

  // Invoices
  invoices: {
    getAll: (params = {}) => fetchAPI(`/invoices?${new URLSearchParams(params)}`),
    getById: (id) => fetchAPI(`/invoices/${id}`),
    create: (data) => fetchAPI('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Quotations
  quotations: {
    getAll: (params = {}) => fetchAPI(`/quotations?${new URLSearchParams(params)}`),
    getById: (id) => fetchAPI(`/quotations/${id}`),
    create: (data) => fetchAPI('/quotations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Tickets
  tickets: {
    getAll: (params = {}) => fetchAPI(`/tickets?${new URLSearchParams(params)}`),
    getById: (id) => fetchAPI(`/tickets/${id}`),
    create: (data) => fetchAPI('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    addResponse: (id, message, isStaffResponse = false) => fetchAPI(`/tickets/${id}/responses`, {
      method: 'POST',
      body: JSON.stringify({ message, is_staff_response: isStaffResponse }),
    }),
  },
};

// Auth helpers
export const isAuthenticated = () => !!getToken();
export const getAuthToken = getToken;
export const clearAuth = removeToken;

export default api;
