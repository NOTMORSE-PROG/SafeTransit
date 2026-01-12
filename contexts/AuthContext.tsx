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
        // Trust local token immediately for offline support
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);

        // Verify token in background (non-blocking)
        verifyTokenInBackground(storedToken);
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

  const verifyTokenInBackground = async (storedToken: string) => {
    try {
      const response = await apiFetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        // Update stored user data
        await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
      } else if (response.status === 401) {
        // Only clear auth if explicitly unauthorized (not network errors)
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('user_data');
        setToken(null);
        setUser(null);
      }
      // If network error or other issues, keep local auth
    } catch (error) {
      console.error('Background token verification failed:', error);
      // Keep local auth on network errors
    }
  };

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

  const refreshUser = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
