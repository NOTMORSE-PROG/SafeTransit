// Nominatim API Service for Location Search
// Uses backend API for geocoding to handle rate limits and caching
// Includes offline fallback for Grab-like offline support

import { isOnline } from './offlineManager';
import {
  searchOfflineLocations,
  cacheNearbyLocations,
  getCachedNearbyLocations,
} from './offlineLocationCache';

export interface NominatimPlace {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    municipality?: string;
    province?: string;
    region?: string;
    country?: string;
    postcode?: string;
    building?: string;
    amenity?: string;
    shop?: string;
    tourism?: string;
    office?: string;
  };
}

export interface LocationSearchResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  distance_km?: number;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// In-memory cache for reverse geocode results (session-scoped)
const reverseGeocodeCache = new Map<string, { result: LocationSearchResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Coordinate precision for cache key (~11m accuracy)
const COORD_PRECISION = 4;

/**
 * Get cache key from coordinates
 */
function getCacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(COORD_PRECISION)},${longitude.toFixed(COORD_PRECISION)}`;
}

/**
 * Search for locations using SafeTransit Backend API
 * Supports proximity-based search when user location is provided (Grab-like)
 * Optionally accepts auth token for personalized ranking
 * Falls back to offline cache when no network connection
 */
export async function searchLocations(
  query: string,
  userLocation?: { latitude: number; longitude: number },
  limit: number = 10,
  authToken?: string | null
): Promise<LocationSearchResult[]> {
  // Check network status
  const online = isOnline();

  // If offline, use cached locations
  if (!online) {
    console.log('Offline mode: searching cached locations');
    return searchOfflineLocations(query, limit);
  }

  try {
    // Build URL with query parameters
    const params = new URLSearchParams({
      q: query,
    });

    // Add user location for proximity-based ranking
    if (userLocation) {
      params.append('lat', userLocation.latitude.toString());
      params.append('lon', userLocation.longitude.toString());
    }

    // Build headers with optional authentication
    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Call our backend API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(
      `${API_BASE_URL}/api/locations/search?${params.toString()}`,
      {
        headers,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Location search error: ${response.statusText}`);
    }

    const data = await response.json();

    // Map backend response to frontend interface
    const results = data.slice(0, limit).map((item: {
      id: string;
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      type: string;
      distance_km?: number;
    }) => ({
      id: item.id,
      name: item.name,
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
      type: item.type,
      distance_km: item.distance_km,
    }));

    // Cache results for offline use (if user location available)
    if (userLocation && results.length > 0) {
      cacheNearbyLocations(
        userLocation.latitude,
        userLocation.longitude,
        results
      ).catch(err => console.log('Failed to cache results:', err));
    }

    return results;
  } catch (error) {
    console.error('Location search error:', error);

    // Fallback to offline cache on network error
    console.log('Network error, falling back to cached locations');

    // Try to get cached nearby locations if user location available
    if (userLocation) {
      const cached = await getCachedNearbyLocations(
        userLocation.latitude,
        userLocation.longitude
      );
      if (cached.length > 0) {
        return cached.slice(0, limit);
      }
    }

    // Otherwise search offline locations
    return searchOfflineLocations(query, limit);
  }
}

/**
 * Reverse geocode: Get address from coordinates
 * Uses backend API with fallback chain: Cache -> Photon -> Nominatim
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<LocationSearchResult | null> {
  try {
    // Check in-memory cache first
    const cacheKey = getCacheKey(latitude, longitude);
    const cached = reverseGeocodeCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }

    // Call backend API
    const response = await fetch(
      `${API_BASE_URL}/api/locations/reverse?lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Reverse geocode error: ${response.statusText}`);
    }

    const result: LocationSearchResult = await response.json();

    // Cache the result
    reverseGeocodeCache.set(cacheKey, { result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error('Reverse geocode error:', error);

    // Return fallback instead of null for graceful degradation
    return createFallbackLocation(latitude, longitude);
  }
}

/**
 * Create a fallback location when geocoding fails
 */
function createFallbackLocation(latitude: number, longitude: number): LocationSearchResult {
  return {
    id: `fallback_${Date.now()}`,
    name: 'Selected Location',
    address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    latitude,
    longitude,
    type: 'pin_drop'
  };
}

// Debounce state for reverse geocode
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingCoords: { latitude: number; longitude: number } | null = null;
let pendingResolvers: {
  resolve: (value: LocationSearchResult | null) => void;
  reject: (error: Error) => void;
}[] = [];

/**
 * Debounced reverse geocode for map picker
 * Prevents excessive API calls during map drag
 * All pending requests will receive the same result
 */
export function reverseGeocodeDebounced(
  latitude: number,
  longitude: number,
  delay: number = 500
): Promise<LocationSearchResult | null> {
  return new Promise((resolve, reject) => {
    // Update pending coordinates to latest
    pendingCoords = { latitude, longitude };

    // Cancel previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Add this resolver to pending list
    pendingResolvers.push({ resolve, reject });

    debounceTimer = setTimeout(async () => {
      const coords = pendingCoords;
      const resolvers = [...pendingResolvers];

      // Clear state
      pendingCoords = null;
      pendingResolvers = [];
      debounceTimer = null;

      if (!coords) {
        resolvers.forEach(p => p.resolve(null));
        return;
      }

      try {
        const result = await reverseGeocode(coords.latitude, coords.longitude);
        resolvers.forEach(p => p.resolve(result));
      } catch {
        // Even on error, provide fallback
        const fallback = createFallbackLocation(coords.latitude, coords.longitude);
        resolvers.forEach(p => p.resolve(fallback));
      }
    }, delay);
  });
}

/**
 * Cancel any pending debounced reverse geocode
 */
export function cancelPendingReverseGeocode(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  pendingCoords = null;
  pendingResolvers.forEach(p => p.resolve(null));
  pendingResolvers = [];
}

/**
 * Clear the reverse geocode cache
 */
export function clearReverseGeocodeCache(): void {
  reverseGeocodeCache.clear();
}

/**
 * Get popular places in Manila as suggestions
 */
export async function getManilaPopularPlaces(): Promise<LocationSearchResult[]> {
  const popularPlaces = [
    'Makati City Hall',
    'SM Mall of Asia',
    'BGC Taguig',
    'NAIA Terminal 3',
    'Quezon City Hall',
    'Manila City Hall',
    'Ortigas Center',
    'Greenhills Shopping Center',
  ];

  const results: LocationSearchResult[] = [];

  for (const place of popularPlaces.slice(0, 5)) {
    const searchResults = await searchLocations(place);
    if (searchResults.length > 0) {
      results.push(searchResults[0]);
    }
  }

  return results;
}

/**
 * Format distance for display (Grab-like)
 */
export function formatDistanceDisplay(distanceKm: number | undefined): string {
  if (distanceKm === undefined || distanceKm === null) {
    return '';
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }

  return `${distanceKm.toFixed(1)}km`;
}
