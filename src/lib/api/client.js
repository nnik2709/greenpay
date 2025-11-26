/**
 * GreenPay API Client - PostgreSQL Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://greenpay.eywademo.cloud/api';

// Token management
const TOKEN_KEY = 'greenpay_auth_token';
const USER_KEY = 'greenpay_user';

const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

const setStoredUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

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

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    // Only log unexpected errors (not 404s for endpoints not yet implemented)
    const isExpected404 = endpoint.includes('/transactions') ||
                          endpoint.includes('/bulk-uploads') ||
                          endpoint.includes('/payment-modes');

    if (!isExpected404 || !error.message.includes('Route not found')) {
      console.error('API Error:', error);
    }
    throw error;
  }
};

export const api = {
  // Auth
  auth: {
    register: async (data) => {
      const result = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (result.token) {
        setToken(result.token);
        setStoredUser(result.user);
      }
      return result;
    },
    
    login: async (email, password) => {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.token) {
        setToken(data.token);
        setStoredUser(data.user);
      }
      return data;
    },
    
    logout: async () => {
      try {
        await fetchAPI('/auth/logout', { method: 'POST' });
      } finally {
        removeToken();
      }
    },
    
    getCurrentUser: async () => {
      try {
        const response = await fetchAPI('/auth/me');
        // Backend returns { user: {...} }, unwrap it
        return response.user || response;
      } catch (error) {
        removeToken();
        throw error;
      }
    },
    
    getSession: () => {
      const token = getToken();
      const user = getStoredUser();
      if (token && user) {
        return { session: { user, token } };
      }
      return { session: null };
    },
    
    changePassword: (currentPassword, newPassword) => fetchAPI('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

    requestPasswordReset: (email) => fetchAPI('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

    resetPassword: (token, newPassword) => fetchAPI('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

    verifyResetToken: (token) => fetchAPI('/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
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
    update: (id, data) => fetchAPI(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/tickets/${id}`, {
      method: 'DELETE',
    }),
    addResponse: (id, message, isStaffResponse = false) => fetchAPI(`/tickets/${id}/responses`, {
      method: 'POST',
      body: JSON.stringify({ message, is_staff_response: isStaffResponse }),
    }),
  },

  // Transactions
  transactions: {
    getAll: (params = {}) => fetchAPI(`/transactions?${new URLSearchParams(params)}`),
    getById: (id) => fetchAPI(`/transactions/${id}`),
  },

  // Settings
  settings: {
    get: () => fetchAPI('/settings'),
    update: (data) => fetchAPI('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },

  // Payment Modes
  paymentModes: {
    getAll: () => fetchAPI('/payment-modes'),
    create: (data) => fetchAPI('/payment-modes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => fetchAPI(`/payment-modes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/payment-modes/${id}`, {
      method: 'DELETE',
    }),
  },

  // Vouchers
  vouchers: {
    validate: (code) => fetchAPI(`/vouchers/validate/${encodeURIComponent(code)}`),
    markUsed: (code) => fetchAPI(`/vouchers/mark-used/${encodeURIComponent(code)}`, {
      method: 'POST',
    }),
  },
};

// Auth helpers
export const isAuthenticated = () => !!getToken();
export const getAuthToken = getToken;
export const clearAuth = removeToken;

export default api;
