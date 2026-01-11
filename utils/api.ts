import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Get the API base URL based on the environment
 * - In development (Expo Go or dev builds), uses the Metro bundler URL
 * - In production, would use your deployed API URL
 */
export function getApiUrl(): string {
  // In development, use the Metro bundler URL
  if (__DEV__) {
    // Get the dev server host from Expo Constants
    const debuggerHost = Constants.expoConfig?.hostUri;

    if (debuggerHost) {
      // Extract just the IP/hostname (remove port if present)
      const host = debuggerHost.split(':')[0];
      // Use port 8082 (or whatever port Metro is running on)
      return Platform.select({
        android: `http://${host}:8082`,
        ios: `http://${host}:8082`,
        default: '',
      });
    }

    // Fallback to localhost
    return Platform.select({
      android: 'http://10.0.2.2:8082', // Android emulator
      ios: 'http://localhost:8082',
      default: 'http://localhost:8082',
    });
  }

  // In production, you would use your deployed API URL
  // TODO: Add production API URL when ready
  // return process.env.EXPO_PUBLIC_API_URL || 'https://your-api.com';
  return '';
}

/**
 * Fetch wrapper that automatically prepends the API URL
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}${path}`;

  return fetch(url, options);
}
