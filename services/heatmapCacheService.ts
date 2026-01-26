/**
 * Heatmap Cache Service
 * Manages AsyncStorage caching for safety heatmap zones with 10-minute TTL
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = 'heatmap_cache_';
const HEATMAP_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_ENTRIES = 20; // Store max 20 viewport caches

export interface HeatmapZone {
  id: string;
  geohash: string;
  center_lat: number;
  center_lon: number;
  safety_score: number;
  tip_count: number;
  last_updated: string;
}

interface HeatmapCacheEntry {
  zones: HeatmapZone[];
  timestamp: number;
  bounds: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
}

/**
 * Generate cache key from bounds (rounded to 3 decimal places for consistency)
 */
function generateCacheKey(bounds: { south: number; west: number; north: number; east: number }): string {
  const roundedBounds = {
    south: bounds.south.toFixed(3),
    west: bounds.west.toFixed(3),
    north: bounds.north.toFixed(3),
    east: bounds.east.toFixed(3),
  };
  return `${CACHE_KEY_PREFIX}${roundedBounds.south}_${roundedBounds.west}_${roundedBounds.north}_${roundedBounds.east}`;
}

/**
 * Get heatmap zones from cache if available and not expired
 */
export async function getHeatmapFromCache(bounds: {
  south: number;
  west: number;
  north: number;
  east: number;
}): Promise<HeatmapZone[] | null> {
  try {
    const cacheKey = generateCacheKey(bounds);
    const cached = await AsyncStorage.getItem(cacheKey);

    if (!cached) {
      console.log('[HeatmapCache] Cache miss for bounds:', bounds);
      return null;
    }

    const entry: HeatmapCacheEntry = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - entry.timestamp > HEATMAP_CACHE_TTL) {
      console.log('[HeatmapCache] Cache expired, removing:', cacheKey);
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    console.log(`[HeatmapCache] Cache hit! Returning ${entry.zones.length} zones`);
    return entry.zones;
  } catch (error) {
    console.error('[HeatmapCache] Error reading from cache:', error);
    return null;
  }
}

/**
 * Save heatmap zones to cache
 */
export async function setHeatmapCache(
  bounds: { south: number; west: number; north: number; east: number },
  zones: HeatmapZone[]
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(bounds);
    const entry: HeatmapCacheEntry = {
      zones,
      timestamp: Date.now(),
      bounds,
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
    console.log(`[HeatmapCache] Cached ${zones.length} zones for bounds:`, bounds);

    // Trigger cleanup to enforce max entries
    await cleanupExpiredHeatmapCache();
  } catch (error) {
    console.error('[HeatmapCache] Error writing to cache:', error);
  }
}

/**
 * Clean up expired cache entries and enforce LRU eviction
 */
export async function cleanupExpiredHeatmapCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const heatmapKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));

    if (heatmapKeys.length === 0) return;

    const now = Date.now();
    const entries: { key: string; timestamp: number }[] = [];

    // Read all cache entries to check expiry and get timestamps
    for (const key of heatmapKeys) {
      try {
        const cached = await AsyncStorage.getItem(key);
        if (!cached) continue;

        const entry: HeatmapCacheEntry = JSON.parse(cached);

        // Mark expired entries for removal
        if (now - entry.timestamp > HEATMAP_CACHE_TTL) {
          await AsyncStorage.removeItem(key);
          console.log('[HeatmapCache] Removed expired entry:', key);
        } else {
          entries.push({ key, timestamp: entry.timestamp });
        }
      } catch {
        // Invalid cache entry, remove it
        await AsyncStorage.removeItem(key);
        console.warn('[HeatmapCache] Removed invalid cache entry:', key);
      }
    }

    // Enforce max entries with LRU eviction (remove oldest)
    if (entries.length > MAX_CACHE_ENTRIES) {
      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      const toRemove = entries.slice(0, entries.length - MAX_CACHE_ENTRIES);
      const keysToRemove = toRemove.map((e) => e.key);

      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`[HeatmapCache] LRU eviction: Removed ${keysToRemove.length} oldest entries`);
    }

    console.log(`[HeatmapCache] Cleanup complete. Active entries: ${Math.min(entries.length, MAX_CACHE_ENTRIES)}`);
  } catch (error) {
    console.error('[HeatmapCache] Error during cleanup:', error);
  }
}

/**
 * Clear all heatmap cache entries
 */
export async function clearHeatmapCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const heatmapKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));

    if (heatmapKeys.length > 0) {
      await AsyncStorage.multiRemove(heatmapKeys);
      console.log(`[HeatmapCache] Cleared all ${heatmapKeys.length} cache entries`);
    }
  } catch (error) {
    console.error('[HeatmapCache] Error clearing cache:', error);
  }
}
