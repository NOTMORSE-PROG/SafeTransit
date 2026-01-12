// Google Authentication Hook
// Handles Google OAuth flow using native Google Sign-In SDK
// Supports both sign-in/signup and account linking
// NOTE: Google Sign-In requires a development build and won't work in Expo Go

import { useState, useEffect, useRef } from 'react';
import Constants from 'expo-constants';
import { apiFetch } from '@/utils/api';

const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

// Check if running in Expo Go (where native modules aren't available)
// In production builds, executionEnvironment is 'standalone'
// In Expo Go, executionEnvironment is 'storeClient'
const isExpoGo = Constants.executionEnvironment === 'storeClient';

interface GoogleAuthUser {
  id: string;
  email: string;
  fullName: string;
  profileImageUrl: string | null;
  phoneNumber: string | null;
  onboardingCompleted: boolean;
  hasGoogleLinked: boolean;
  hasPasswordSet: boolean;
}

// Type for the GoogleSignin module
type GoogleSigninType = typeof import('@react-native-google-signin/google-signin').GoogleSignin;

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(!isExpoGo);
  const googleSigninRef = useRef<GoogleSigninType | null>(null);

  // Dynamically import and configure Google Sign-In on component mount
  // This prevents the app from crashing in Expo Go
  useEffect(() => {
    if (isExpoGo) {
      console.log('Google Sign-In is not available in Expo Go. Use a development build for Google authentication.');
      return;
    }

    // Dynamically import to avoid crash in Expo Go
    const initGoogleSignIn = async () => {
      try {
        console.log('Initializing Google Sign-In...');
        console.log('Web Client ID:', GOOGLE_WEB_CLIENT_ID);

        if (!GOOGLE_WEB_CLIENT_ID) {
          console.error('Google Web Client ID is missing!');
          setIsAvailable(false);
          return;
        }

        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        googleSigninRef.current = GoogleSignin;

        GoogleSignin.configure({
          webClientId: GOOGLE_WEB_CLIENT_ID,
          offlineAccess: false,
          forceCodeForRefreshToken: false,
        });

        console.log('Google Sign-In configured successfully');
        setIsAvailable(true);
      } catch (error) {
        console.error('Google Sign-In initialization error:', error);
        setIsAvailable(false);
      }
    };

    initGoogleSignIn();
  }, []);

  const signInWithGoogle = async (): Promise<{
    success: boolean;
    token?: string;
    user?: GoogleAuthUser;
    error?: string;
  }> => {
    // Check if running in Expo Go
    if (isExpoGo || !googleSigninRef.current) {
      return {
        success: false,
        error: 'Google Sign-In requires a development build. Please use email login in Expo Go.',
      };
    }

    const GoogleSignin = googleSigninRef.current;

    try {
      // Check if Google Client ID is configured
      if (!GOOGLE_WEB_CLIENT_ID || GOOGLE_WEB_CLIENT_ID === '') {
        return {
          success: false,
          error: 'Google Sign-In is not configured. Please contact support.',
        };
      }

      setIsLoading(true);

      // Check if device supports Google Play Services (Android)
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      await GoogleSignin.signIn();

      // Get ID token
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;

      if (!idToken) {
        return {
          success: false,
          error: 'Failed to get Google authentication token.',
        };
      }

      // Exchange Google token for our JWT
      const response = await apiFetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleToken: idToken }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, token: data.token, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: unknown) {
      console.error('Google sign-in error:', error);

      // Handle specific error codes
      const errorCode = (error as { code?: string }).code;
      if (errorCode === 'SIGN_IN_CANCELLED') {
        return { success: false, error: 'Sign-in cancelled' };
      } else if (errorCode === 'IN_PROGRESS') {
        return { success: false, error: 'Sign-in already in progress' };
      } else if (errorCode === 'PLAY_SERVICES_NOT_AVAILABLE') {
        return {
          success: false,
          error: 'Google Play Services not available. Please use email login.',
        };
      }

      return {
        success: false,
        error: 'Google authentication failed. Please try again or use email login.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const linkGoogleAccount = async (authToken: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    // Check if running in Expo Go
    if (isExpoGo || !googleSigninRef.current) {
      return {
        success: false,
        error: 'Google Sign-In requires a development build. This feature is not available in Expo Go.',
      };
    }

    const GoogleSignin = googleSigninRef.current;

    try {
      // Check if Google Client ID is configured
      if (!GOOGLE_WEB_CLIENT_ID || GOOGLE_WEB_CLIENT_ID === '') {
        return {
          success: false,
          error: 'Google Sign-In is not configured. Please contact support.',
        };
      }

      setIsLoading(true);

      // Check if device supports Google Play Services (Android)
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      await GoogleSignin.signIn();

      // Get ID token
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;

      if (!idToken) {
        return {
          success: false,
          error: 'Failed to get Google authentication token.',
        };
      }

      const response = await apiFetch('/api/auth/link-google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ googleToken: idToken }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: unknown) {
      console.error('Link Google error:', error);

      // Handle specific error codes
      const errorCode = (error as { code?: string }).code;
      if (errorCode === 'SIGN_IN_CANCELLED') {
        return { success: false, error: 'Sign-in cancelled' };
      } else if (errorCode === 'PLAY_SERVICES_NOT_AVAILABLE') {
        return {
          success: false,
          error: 'Google Play Services not available.',
        };
      }

      return {
        success: false,
        error: 'Failed to connect Google account. Please try again later.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signInWithGoogle,
    linkGoogleAccount,
    isLoading,
    isAvailable, // New: lets components know if Google Sign-In is available
  };
};
