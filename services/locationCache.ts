// Multi-Layer Location Cache Service
// Implements Grab-like caching strategy:
// Layer 1: In-memory (session) - fastest
// Layer 2: AsyncStorage (persistent) - survives app restarts
// Layer 3: Backend API - source of truth

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

type TTLKey = 'REVERSE_GEOCODE' | 'SEARCH_RESULTS' | 'POPULAR_PLACES' | 'USER_FREQUENT';

class LocationCache {
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private asyncStoragePrefix = '@SafeTransit:cache:';

  // TTL values in milliseconds (Grab-like)
  private TTL: Record<TTLKey, number> = {
    REVERSE_GEOCODE: 5 * 60 * 1000,    // 5 minutes - addresses don't change often
    SEARCH_RESULTS: 2 * 60 * 1000,     // 2 minutes - search results can change
    POPULAR_PLACES: 30 * 60 * 1000,    // 30 minutes - popular places are stable
    USER_FREQUENT: 10 * 60 * 1000,     // 10 minutes - user patterns
  };

  // Singleton instance
  private static instance: LocationCache;

  public static getInstance(): LocationCache {
    if (!LocationCache.instance) {
      LocationCache.instance = new LocationCache();
    }
    return LocationCache.instance;
  }

  /**
   * Layer 1: Get from memory cache (fastest)
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Layer 2: Get from AsyncStorage (persists across sessions)
   */
  private async getFromStorage<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(this.asyncStoragePrefix + key);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);

      if (Date.now() - entry.timestamp > entry.ttl) {
        // Expired - clean up
        await AsyncStorage.removeItem(this.asyncStoragePrefix + key);
        return null;
      }

      // Promote to memory cache for faster subsequent access
      this.memoryCache.set(key, entry);
      return entry.data;
    } catch (error) {
      console.error('Cache storage read error:', error);
      return null;
    }
  }

  /**
   * Get from cache with multi-layer fallback
   * Memory → AsyncStorage → null (caller fetches from API)
   */
  async get<T>(key: string): Promise<T | null> {
    // Try memory first (fastest)
    const memoryResult = this.getFromMemory<T>(key);
    if (memoryResult !== null) {
      return memoryResult;
    }

    // Try persistent storage
    return this.getFromStorage<T>(key);
  }

  /**
   * Set in both cache layers
   */
  async set<T>(key: string, data: T, ttlKey: TTLKey): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: this.TTL[ttlKey],
    };

    // Memory cache (synchronous)
    this.memoryCache.set(key, entry);

    // Async storage (non-blocking)
    AsyncStorage.setItem(
      this.asyncStoragePrefix + key,
      JSON.stringify(entry)
    ).catch(error => {
      console.error('Cache storage write error:', error);
    });
  }

  /**
   * Generate cache key for reverse geocode
   */
  static reverseGeocodeKey(lat: number, lon: number, precision: number = 4): string {
    return `reverse:${lat.toFixed(precision)},${lon.toFixed(precision)}`;
  }

  /**
   * Generate cache key for search results
   */
  static searchKey(query: string, lat?: number, lon?: number): string {
    const normalized = query.toLowerCase().trim();
    if (lat !== undefined && lon !== undefined) {
      return `search:${normalized}:${lat.toFixed(2)},${lon.toFixed(2)}`;
    }
    return `search:${normalized}`;
  }

  /**
   * Generate cache key for popular places
   */
  static popularKey(lat?: number, lon?: number, radius?: number): string {
    if (lat !== undefined && lon !== undefined) {
      return `popular:${lat.toFixed(2)},${lon.toFixed(2)}:${radius || 10}`;
    }
    return 'popular:global';
  }

  /**
   * Delete a specific cache entry
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await AsyncStorage.removeItem(this.asyncStoragePrefix + key);
  }

  /**
   * Clear all expired entries from memory cache
   */
  cleanupMemory(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();

    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.asyncStoragePrefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): { memorySize: number; memoryKeys: string[] } {
    return {
      memorySize: this.memoryCache.size,
      memoryKeys: Array.from(this.memoryCache.keys()),
    };
  }
}

// Export singleton instance
export const locationCache = LocationCache.getInstance();

// Export static methods for key generation
export const CacheKeys = {
  reverseGeocode: LocationCache.reverseGeocodeKey,
  search: LocationCache.searchKey,
  popular: LocationCache.popularKey,
};

// Export types
export type { CacheEntry, TTLKey };
