// Authentication Context
// Global state management for user authentication
// Handles token storage, user data, and auth lifecycle

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '@/utils/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  profileImageUrl: string | null;
  phoneNumber: string | null;
  onboardingCompleted: boolean;
  hasGoogleLinked: boolean;
  hasPasswordSet: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStoredAuth = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user_data');

      if (storedToken && storedUser) {
        // Trust local token - it will be validated on subsequent API calls
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const login = async (newToken: string, newUser: User) => {
    await AsyncStorage.setItem('auth_token', newToken);
    await AsyncStorage.setItem('user_data', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
    setToken(null);
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      // Refresh user data from profile endpoint
      const response = await apiFetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const userData = {
            id: data.data.id,
            email: data.data.email,
            fullName: data.data.full_name,
            profileImageUrl: data.data.profile_image_url,
            phoneNumber: data.data.phone_number,
            onboardingCompleted: data.data.onboarding_completed,
            hasGoogleLinked: !!data.data.google_id,
            hasPasswordSet: !!data.data.password_hash,
          };
          setUser(userData);
          await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        }
      } else if (response.status === 401) {
        // Token expired or invalid, clear auth
        await logout();
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [token]);

  // Refresh user data from server after loading from storage
  useEffect(() => {
    if (token && !isLoading) {
      refreshUser();
    }
  }, [token, isLoading, refreshUser]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
