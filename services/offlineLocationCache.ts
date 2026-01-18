// Offline Location Cache
// Prefetches and caches frequent locations for offline access (Grab-like)
// Stores user's saved places, recent searches, and nearby locations

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSavedPlaces, getRecentLocations } from './locationStorage';
import type { LocationSearchResult } from './nominatim';

const OFFLINE_LOCATIONS_KEY = '@SafeTransit:offlineLocations';
const OFFLINE_NEARBY_KEY = '@SafeTransit:offlineNearby';
const PREFETCH_STATUS_KEY = '@SafeTransit:prefetchStatus';

interface OfflineLocation extends LocationSearchResult {
  cachedAt: string;
  source: 'saved' | 'recent' | 'nearby' | 'popular';
}

interface PrefetchStatus {
  lastPrefetchAt: string;
  locationCount: number;
  nearbyCount: number;
}

/**
 * Prefetch user's frequent locations for offline use
 * Should be called on app launch when online
 */
export async function prefetchOfflineLocations(_userId?: string): Promise<void> {
  try {
    console.log('Prefetching locations for offline use...');

    const offlineLocations: OfflineLocation[] = [];

    // 1. Get saved places (home, work, favorites)
    const savedPlaces = await getSavedPlaces(true); // Sync from server first
    savedPlaces.forEach(place => {
      offlineLocations.push({
        id: place.id,
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        type: place.type,
        cachedAt: new Date().toISOString(),
        source: 'saved',
      });
    });

    // 2. Get recent locations
    const recentLocations = await getRecentLocations();
    recentLocations.slice(0, 20).forEach(location => {
      // Avoid duplicates
      if (!offlineLocations.some(l => l.id === location.id)) {
        offlineLocations.push({
          id: location.id,
          name: location.name,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          type: 'recent',
          cachedAt: new Date().toISOString(),
          source: 'recent',
        });
      }
    });

    // 3. Fetch popular nearby locations if user location available
    // (This would require API call, so only do if online and have location)

    // Save to offline cache
    await AsyncStorage.setItem(
      OFFLINE_LOCATIONS_KEY,
      JSON.stringify(offlineLocations)
    );

    // Update prefetch status
    const status: PrefetchStatus = {
      lastPrefetchAt: new Date().toISOString(),
      locationCount: offlineLocations.length,
      nearbyCount: 0,
    };
    await AsyncStorage.setItem(PREFETCH_STATUS_KEY, JSON.stringify(status));

    console.log(`Prefetched ${offlineLocations.length} locations for offline use`);
  } catch (error) {
    console.error('Failed to prefetch offline locations:', error);
  }
}

/**
 * Get cached offline locations
 * Used when device is offline
 */
export async function getOfflineLocations(): Promise<OfflineLocation[]> {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_LOCATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get offline locations:', error);
    return [];
  }
}

/**
 * Search offline locations
 * Fuzzy search through cached locations
 */
export async function searchOfflineLocations(
  query: string,
  limit: number = 10
): Promise<LocationSearchResult[]> {
  try {
    const offlineLocations = await getOfflineLocations();
    const queryLower = query.toLowerCase();

    // Filter and score
    const results = offlineLocations
      .map(location => {
        const nameLower = location.name.toLowerCase();
        const addressLower = location.address.toLowerCase();

        let score = 0;

        // Exact match
        if (nameLower === queryLower) score = 100;
        // Starts with
        else if (nameLower.startsWith(queryLower)) score = 80;
        // Contains
        else if (nameLower.includes(queryLower)) score = 60;
        // Address match
        else if (addressLower.includes(queryLower)) score = 40;

        // Boost saved places
        if (location.source === 'saved') score += 20;

        return { location, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => {
        const { cachedAt: _cachedAt, source: _source, ...rest } = item.location;
        return rest;
      });

    return results;
  } catch (error) {
    console.error('Failed to search offline locations:', error);
    return [];
  }
}

/**
 * Cache nearby locations for a specific area
 * Called when user searches in a new area while online
 */
export async function cacheNearbyLocations(
  latitude: number,
  longitude: number,
  locations: LocationSearchResult[]
): Promise<void> {
  try {
    // Create cache key from rounded coordinates
    const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;

    // Get existing nearby cache
    const nearbyData = await AsyncStorage.getItem(OFFLINE_NEARBY_KEY);
    const nearbyCache: Record<string, OfflineLocation[]> = nearbyData
      ? JSON.parse(nearbyData)
      : {};

    // Cache these locations
    nearbyCache[cacheKey] = locations.map(loc => ({
      ...loc,
      cachedAt: new Date().toISOString(),
      source: 'nearby' as const,
    }));

    // Keep only last 10 areas (prevent cache bloat)
    const keys = Object.keys(nearbyCache);
    if (keys.length > 10) {
      // Remove oldest
      const sortedKeys = keys.sort((a, b) => {
        const timeA = nearbyCache[a][0]?.cachedAt || '';
        const timeB = nearbyCache[b][0]?.cachedAt || '';
        return timeA.localeCompare(timeB);
      });
      sortedKeys.slice(0, keys.length - 10).forEach(key => {
        delete nearbyCache[key];
      });
    }

    await AsyncStorage.setItem(OFFLINE_NEARBY_KEY, JSON.stringify(nearbyCache));
  } catch (error) {
    console.error('Failed to cache nearby locations:', error);
  }
}

/**
 * Get cached nearby locations for an area
 * Used when offline to show previously searched areas
 */
export async function getCachedNearbyLocations(
  latitude: number,
  longitude: number,
  radiusKm: number = 2
): Promise<LocationSearchResult[]> {
  try {
    const nearbyData = await AsyncStorage.getItem(OFFLINE_NEARBY_KEY);
    if (!nearbyData) return [];

    const nearbyCache: Record<string, OfflineLocation[]> = JSON.parse(nearbyData);

    // Find cached areas within radius
    const results: LocationSearchResult[] = [];

    Object.entries(nearbyCache).forEach(([cacheKey, locations]) => {
      const [cachedLat, cachedLon] = cacheKey.split(',').map(Number);

      // Simple distance check (rough)
      const latDiff = Math.abs(cachedLat - latitude);
      const lonDiff = Math.abs(cachedLon - longitude);
      const roughDistance = Math.sqrt(latDiff ** 2 + lonDiff ** 2) * 111; // Rough km

      if (roughDistance <= radiusKm) {
        locations.forEach(loc => {
          const { cachedAt: _cachedAt, source: _source, ...rest } = loc;
          if (!results.some(r => r.id === rest.id)) {
            results.push(rest);
          }
        });
      }
    });

    return results;
  } catch (error) {
    console.error('Failed to get cached nearby locations:', error);
    return [];
  }
}

/**
 * Get prefetch status (for UI display)
 */
export async function getPrefetchStatus(): Promise<PrefetchStatus | null> {
  try {
    const data = await AsyncStorage.getItem(PREFETCH_STATUS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get prefetch status:', error);
    return null;
  }
}

/**
 * Clear offline cache
 */
export async function clearOfflineCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      OFFLINE_LOCATIONS_KEY,
      OFFLINE_NEARBY_KEY,
      PREFETCH_STATUS_KEY,
    ]);
    console.log('Offline cache cleared');
  } catch (error) {
    console.error('Failed to clear offline cache:', error);
  }
}

/**
 * Get cache size (for UI display)
 */
export async function getOfflineCacheSize(): Promise<{
  locations: number;
  nearbyAreas: number;
}> {
  try {
    const [locationsData, nearbyData] = await Promise.all([
      AsyncStorage.getItem(OFFLINE_LOCATIONS_KEY),
      AsyncStorage.getItem(OFFLINE_NEARBY_KEY),
    ]);

    const locations = locationsData ? JSON.parse(locationsData).length : 0;
    const nearbyCache = nearbyData ? JSON.parse(nearbyData) : {};
    const nearbyAreas = Object.keys(nearbyCache).length;

    return { locations, nearbyAreas };
  } catch (error) {
    console.error('Failed to get cache size:', error);
    return { locations: 0, nearbyAreas: 0 };
  }
}
