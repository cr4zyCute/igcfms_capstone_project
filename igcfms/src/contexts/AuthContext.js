import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getProfile } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const buildUserProfile = (data = {}, fallback = {}) => {
  const safe = (value) => (typeof value === 'string' ? value.trim() : '');
  const firstName = safe(data.first_name || data.firstName || fallback.first_name || fallback.firstName);
  const lastName = safe(data.last_name || data.lastName || fallback.last_name || fallback.lastName);
  const composedName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const email = safe(data.email || fallback.email || '');
  const role = data.role || data.user_role || data.position || fallback.role || '';

  return {
    id: data.id || fallback.id || null,
    email,
    role,
    name: safe(data.name || data.full_name || data.fullName) || composedName || email || fallback.name || '',
    force_password_change: data.force_password_change !== undefined ? data.force_password_change : (fallback.force_password_change || false),
    ...fallback,
    ...data,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncUserProfile = useCallback(async (fallbackData = {}) => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      const normalized = buildUserProfile({}, fallbackData);
      if (normalized && (normalized.name || normalized.email || normalized.role)) {
        localStorage.setItem('user', JSON.stringify(normalized));
        setUser(normalized);
      }
      return normalized;
    }

    try {
      const profileResponse = await getProfile();
      const profileData = profileResponse?.user || profileResponse?.data || profileResponse;
      const normalizedUser = buildUserProfile(profileData, fallbackData);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      return normalizedUser;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      const fallbackUser = buildUserProfile({}, fallbackData);
      if (fallbackUser && (fallbackUser.name || fallbackUser.email || fallbackUser.role)) {
        localStorage.setItem('user', JSON.stringify(fallbackUser));
        setUser(fallbackUser);
      }
      return fallbackUser;
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token) {
        setLoading(false);
        return;
      }

      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          setUser(parsed);
          if (!parsed?.name) {
            await syncUserProfile(parsed);
          }
        } catch (e) {
          console.error('Failed to parse user data:', e);
          await syncUserProfile();
        }
      } else {
        await syncUserProfile();
      }

      setLoading(false);
    };

    initializeAuth();
  }, [syncUserProfile]);

  const login = async (userData = {}, token) => {
    if (token) {
      // Store token with both keys for compatibility
      localStorage.setItem('auth_token', token);
      localStorage.setItem('token', token);
    }

    await syncUserProfile(userData);
  };

  const logout = () => {
    // Remove both token keys
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clear UI state to prevent showing previous user's data
    localStorage.removeItem('igcfms_activeTab');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading // Make sure loading is included here
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};