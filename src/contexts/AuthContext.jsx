import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { clearAuth } from '@/lib/api/client';

const AuthContext = createContext(null);

// Map backend role names to frontend role names
const mapBackendRoleToFrontend = (backendRole) => {
  const roleMap = {
    'Admin': 'Flex_Admin',
    'Manager': 'Finance_Manager',
    'Agent': 'Counter_Agent',
    'Support': 'IT_Support',
    'Customer': 'Customer',
    // Also handle if backend already returns frontend format
    'Flex_Admin': 'Flex_Admin',
    'Finance_Manager': 'Finance_Manager',
    'Counter_Agent': 'Counter_Agent',
    'IT_Support': 'IT_Support',
  };
  return roleMap[backendRole] || 'Customer';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we have a session
        const { session } = api.auth.getSession();

        if (session?.user) {
          // Fetch full user data from API
          const userData = await api.auth.getCurrentUser();

          setUser({
            id: userData.id,
            email: userData.email,
            role: mapBackendRoleToFrontend(userData.role || userData.role_name || 'Customer'),
            name: userData.name,
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid session
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.auth.login(email, password);

      const mappedRole = mapBackendRoleToFrontend(data.user.role || data.user.role_name || 'Customer');

      const userData = {
        id: data.user.id,
        email: data.user.email,
        role: mappedRole,
        name: data.user.name,
      };

      setUser(userData);
      setIsAuthenticated(true);

      // Log the login event (handled by backend now)
      // But we can still log client-side info if needed
      await logLoginEvent(data.user.id, data.user.email);

      return userData; // Return user data for immediate use
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  };

  const logLoginEvent = async (userId, email) => {
    try {
      const userAgent = navigator.userAgent;
      const ipAddress = await getClientIP();

      // Note: You might need to add an endpoint for this on your backend
      // For now, this is handled by the backend's login endpoint
      console.log('Login event:', { userId, email, userAgent, ipAddress });
    } catch (error) {
      console.error('Error logging login event:', error);
    }
  };

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return '127.0.0.1';
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local state
      clearAuth();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
