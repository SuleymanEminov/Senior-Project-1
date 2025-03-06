import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Define all functions with useCallback before using them in useEffect

  // Refresh token function
  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      // Clear token data and return
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setCurrentUser(null);
      return false;
    }

    try {
      const response = await authService.refreshToken(refresh);
      if (response.status === 200) {
        localStorage.setItem('access_token', response.data.access);
        return true;
      }
      
      // Token refresh failed, clear tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setCurrentUser(null);
      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Token refresh failed, clear tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setCurrentUser(null);
      return false;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        await authService.logout(refresh);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setCurrentUser(null);
      navigate('/login');
    }
  }, [navigate]);

  // Login function
  const login = useCallback(async (username, password) => {
    setError(null);
    try {
      const response = await authService.login({ username, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Get user information
      const userResponse = await fetch('http://localhost:8000/api/users/me/', {
        headers: {
          'Authorization': `Bearer ${response.data.access}`
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData);
        
        // Check user role and redirect accordingly
        if (userData.groups && userData.groups.includes('Manager')) {
          navigate('/manager/dashboard');
        } else {
          navigate('/');
        }
        return true;
      }
      
      return false;
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
      return false;
    }
  }, [navigate]);

  // Register function
  const register = useCallback(async (userData) => {
    setError(null);
    try {
      await authService.register(userData);
      return true;
    } catch (err) {
      setError(err.response?.data || 'Registration failed');
      return false;
    }
  }, []);

  // Check auth status after defining all the functions
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Attempt to get user info to verify token validity
          const response = await fetch('http://localhost:8000/api/users/me/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
          } else {
            // Token invalid or expired, try to refresh
            if (!await refreshToken()) {
              // If refresh fails, clear tokens (handled in refreshToken)
              navigate('/login');
            }
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          // Clear tokens and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setCurrentUser(null);
          navigate('/login');
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, [refreshToken, navigate]);

  // Check if user is in a specific role
  const userHasRole = useCallback((role) => {
    if (!currentUser || !currentUser.groups) return false;
    return currentUser.groups.includes(role);
  }, [currentUser]);

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    userHasRole,
    isManager: useCallback(() => userHasRole('Manager'), [userHasRole]),
    isAdmin: useCallback(() => userHasRole('Admin'), [userHasRole]),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;