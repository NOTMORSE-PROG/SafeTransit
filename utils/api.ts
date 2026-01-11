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
    // Try multiple ways to get the dev server host
    const debuggerHost =
      Constants.expoConfig?.hostUri ||
      Constants.manifest?.debuggerHost ||
      Constants.manifest2?.extra?.expoGo?.debuggerHost;

    console.log('[API] Debugger host:', debuggerHost);

    if (debuggerHost) {
      // Extract just the IP/hostname (remove port if present)
      const host = debuggerHost.split(':')[0];
      const url = Platform.select({
        android: `http://${host}:8082`,
        ios: `http://${host}:8082`,
        default: '',
      });
      console.log('[API] Using URL:', url);
      return url;
    }

    // Fallback to localhost
    const fallbackUrl = Platform.select({
      android: 'http://10.0.2.2:8082', // Android emulator
      ios: 'http://localhost:8082',
      default: 'http://localhost:8082',
    });
    console.log('[API] Using fallback URL:', fallbackUrl);
    return fallbackUrl;
  }

  // In production, use the deployed API URL from environment variable
  const productionUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL;
  if (productionUrl) {
    console.log('[API] Using production URL:', productionUrl);
    return productionUrl;
  }

  console.warn('[API] No production API URL set. App will not work without Metro bundler.');
  return '';
}

/**
 * Fetch wrapper that automatically prepends the API URL
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}${path}`;

  console.log('[API] Fetching:', url);
  console.log('[API] Method:', options?.method || 'GET');

  return fetch(url, options);
}
