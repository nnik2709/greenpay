/**
 * GreenPay API Client - PostgreSQL Backend
 */

import { API_URL as API_BASE_URL } from '@/config/urls';

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

  // Extract responseType before passing to fetch
  const { responseType, ...fetchOptions } = options;

  // Build headers - don't set Content-Type for blob requests
  const headers = {
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...fetchOptions.headers,
  };

  // Only add Content-Type for non-blob requests and when there's a body
  if (responseType !== 'blob' && fetchOptions.body) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...fetchOptions,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));

      // Handle token expiration - redirect to login
      if (response.status === 401 && errorData.error?.includes('expired')) {
        removeToken();
        // Redirect to login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=true';
        }
      }

      // Create error with proper structure to match axios-like error handling
      const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      error.response = {
        data: errorData,
        status: response.status,
        statusText: response.statusText
      };
      throw error;
    }

    // Handle different response types
    if (responseType === 'blob') {
      return response.blob();
    }

    return response.json();
  } catch (error) {
    // Only log unexpected errors (not 404s for endpoints not yet implemented)
    const isExpected404 = endpoint.includes('/transactions') ||
                          endpoint.includes('/bulk-uploads') ||
                          endpoint.includes('/payment-modes');

    if (!isExpected404 || !error.message.includes('Route not found')) {
      console.error('Fetch error from ' + API_BASE_URL + endpoint + ':', error.response?.data || error.message);
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
    update: (id, data) => fetchAPI(`/quotations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/quotations/${id}`, {
      method: 'DELETE',
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
    get: async () => {
      const result = await fetchAPI('/settings');
      if (result && result.settings) {
        return {
          voucherValidityDays: result.settings.voucher_validity_days,
          defaultAmount: result.settings.default_amount,
          gstEnabled: result.settings.gst_enabled,
          termsContent: result.settings.terms_content,
          privacyContent: result.settings.privacy_content,
          refundsContent: result.settings.refunds_content,
          createdAt: result.settings.created_at,
          updatedAt: result.settings.updated_at,
        };
      }
      return null;
    },
    getPublic: async () => {
      const result = await fetchAPI('/settings/public');
      if (result && result.settings) {
        return {
          termsContent: result.settings.terms_content,
          privacyContent: result.settings.privacy_content,
          refundsContent: result.settings.refunds_content,
        };
      }
      return null;
    },
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

  // Generic GET method for custom endpoints
  get: (endpoint, options = {}) => {
    const { params, ...fetchOptions } = options;
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return fetchAPI(`${endpoint}${queryString}`, fetchOptions);
  },

  // Generic POST method for custom endpoints
  post: (endpoint, data = {}, options = {}) => {
    return fetchAPI(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  },

  // Generic PUT method for custom endpoints
  put: (endpoint, data = {}, options = {}) => {
    return fetchAPI(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  },

  // Generic PATCH method for custom endpoints
  patch: (endpoint, data = {}, options = {}) => {
    return fetchAPI(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  },

  // Generic DELETE method for custom endpoints
  delete: (endpoint, options = {}) => {
    return fetchAPI(endpoint, {
      method: 'DELETE',
      ...options,
    });
  },
};

// Auth helpers
export const isAuthenticated = () => !!getToken();
export const getAuthToken = getToken;
export const clearAuth = removeToken;

export default api;
