import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '@/utils/api';
import type { POIType, SafetyPOI } from '@/types/safetyPOI';

import transitBootstrap from '@/constants/safetyPOIs/transitStations.json';
import policeBootstrap from '@/constants/safetyPOIs/policeStations.json';
import hospitalsBootstrap from '@/constants/safetyPOIs/hospitals.json';

const CACHE_KEY_PREFIX = 'safety_poi_cache_';
const CACHE_TTL = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 30;

interface Bounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

interface CacheEntry {
  pois: SafetyPOI[];
  timestamp: number;
}

const BOOTSTRAP: Record<POIType, SafetyPOI[]> = {
  transit: transitBootstrap as SafetyPOI[],
  police: policeBootstrap as SafetyPOI[],
  hospital: hospitalsBootstrap as SafetyPOI[],
};

function generateCacheKey(type: POIType | 'all', bounds: Bounds): string {
  const r = (n: number) => n.toFixed(3);
  return `${CACHE_KEY_PREFIX}${type}_${r(bounds.south)}_${r(bounds.west)}_${r(bounds.north)}_${r(bounds.east)}`;
}

function inBounds(poi: SafetyPOI, bounds: Bounds): boolean {
  return (
    poi.latitude >= bounds.south &&
    poi.latitude <= bounds.north &&
    poi.longitude >= bounds.west &&
    poi.longitude <= bounds.east
  );
}

function getBootstrap(type: POIType | undefined, bounds: Bounds): SafetyPOI[] {
  const types: POIType[] = type ? [type] : ['transit', 'police', 'hospital'];
  const result: SafetyPOI[] = [];
  for (const t of types) {
    for (const poi of BOOTSTRAP[t]) {
      if (inBounds(poi, bounds)) result.push(poi);
    }
  }
  return result;
}

async function readFromCache(cacheKey: string): Promise<SafetyPOI[] | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }
    return entry.pois;
  } catch {
    return null;
  }
}

async function writeToCache(cacheKey: string, pois: SafetyPOI[]): Promise<void> {
  try {
    const entry: CacheEntry = { pois, timestamp: Date.now() };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch {
    /* swallow — cache is best-effort */
  }
}

export async function cleanupExpiredPOICache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_KEY_PREFIX));
    if (cacheKeys.length === 0) return;
    const now = Date.now();
    const toRemove: string[] = [];
    const valid: { key: string; ts: number }[] = [];
    for (const key of cacheKeys) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      try {
        const entry: CacheEntry = JSON.parse(raw);
        if (now - entry.timestamp > CACHE_TTL) {
          toRemove.push(key);
        } else {
          valid.push({ key, ts: entry.timestamp });
        }
      } catch {
        toRemove.push(key);
      }
    }
    if (valid.length > MAX_CACHE_ENTRIES) {
      valid.sort((a, b) => a.ts - b.ts);
      toRemove.push(...valid.slice(0, valid.length - MAX_CACHE_ENTRIES).map((v) => v.key));
    }
    if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
  } catch {
    /* best-effort */
  }
}

/**
 * Fetch POIs for a viewport. Bootstrap-first: returns the offline JSON immediately
 * if the network call fails or there's no cached data yet. Backend results are
 * cached per rounded-bbox for 24h.
 */
export async function fetchPOIs(
  bounds: Bounds,
  type?: POIType
): Promise<SafetyPOI[]> {
  const cacheKey = generateCacheKey(type ?? 'all', bounds);

  const cached = await readFromCache(cacheKey);
  if (cached !== null) return cached;

  try {
    const baseUrl = getApiUrl();
    if (!baseUrl) throw new Error('no api base');

    const params = new URLSearchParams({
      mode: 'poi',
      bounds: `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`,
    });
    if (type) params.set('type', type);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(`${baseUrl}/api/locations/search?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) throw new Error(`http ${resp.status}`);
    const json = await resp.json();
    const pois: SafetyPOI[] = (json.pois || []).map((p: SafetyPOI) => ({
      ...p,
      latitude: typeof p.latitude === 'string' ? parseFloat(p.latitude) : p.latitude,
      longitude: typeof p.longitude === 'string' ? parseFloat(p.longitude) : p.longitude,
    }));
    await writeToCache(cacheKey, pois);
    return pois;
  } catch (err) {
    console.warn('[safetyPOIService] backend fetch failed, using bootstrap:', err);
    return getBootstrap(type, bounds);
  }
}

export const safetyPOIService = {
  fetchPOIs,
  cleanupExpiredPOICache,
};
