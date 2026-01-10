// Google Authentication Hook
// Handles Google OAuth flow using native Google Sign-In SDK
// Supports both sign-in/signup and account linking
// NOTE: Google Sign-In requires a development build and won't work in Expo Go

import { useState, useEffect, useRef } from 'react';
import Constants from 'expo-constants';

const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

// Check if running in Expo Go (where native modules aren't available)
const isExpoGo = Constants.appOwnership === 'expo';

interface GoogleAuthUser {
  id: string;
  email: string;
  fullName: string;
  profileImageUrl: string | null;
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
        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        googleSigninRef.current = GoogleSignin;
        
        GoogleSignin.configure({
          webClientId: GOOGLE_WEB_CLIENT_ID,
          offlineAccess: false,
          forceCodeForRefreshToken: false,
        });
        setIsAvailable(true);
      } catch (error) {
        console.log('Google Sign-In module not available:', error);
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
      const userInfo = await GoogleSignin.signIn();

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
      const response = await fetch('/api/auth/google', {
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
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      // Handle specific error codes
      if (error.code === 'SIGN_IN_CANCELLED') {
        return { success: false, error: 'Sign-in cancelled' };
      } else if (error.code === 'IN_PROGRESS') {
        return { success: false, error: 'Sign-in already in progress' };
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
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

      const response = await fetch('/api/auth/link-google', {
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
    } catch (error: any) {
      console.error('Link Google error:', error);

      // Handle specific error codes
      if (error.code === 'SIGN_IN_CANCELLED') {
        return { success: false, error: 'Sign-in cancelled' };
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
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
