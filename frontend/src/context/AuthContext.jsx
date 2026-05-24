import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Synchronize token and authenticate user on mount
  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          setToken(storedToken);
          const response = await api.getMe();
          if (response.success && response.user) {
            setUser(response.user);
            setIsAuthenticated(true);
          } else {
            // Token invalid or expired
            handleLogout();
          }
        } catch (error) {
          console.error('Auth boot error:', error);
          handleLogout();
        }
      }
      setLoading(false);
    };

    bootstrapAuth();
  }, []);

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.login(email, password);
      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        setLoading(false);
        return { success: true };
      }
      setLoading(false);
      return { success: false, error: 'Authentication failed' };
    } catch (error) {
      setLoading(false);
      let errorMsg = error.message;
      if (errorMsg === 'Failed to fetch') {
        errorMsg = 'Unable to connect to server. Please make sure the backend is running.';
      }
      return { success: false, error: errorMsg || 'Incorrect email or password' };
    }
  };

  const handleRegister = async (userData) => {
    setLoading(true);
    try {
      const response = await api.register(userData);
      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        setLoading(false);
        return { success: true };
      }
      setLoading(false);
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message || 'Error creating account' };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for simple auth consumption
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
