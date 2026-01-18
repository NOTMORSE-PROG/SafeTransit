// Geohash Utility Service
// Implements Grab-like geohash encoding for efficient spatial queries
// Reference: https://www.grab.com/sg/inside-grab/stories/grab-geohashing-location-grid/

import Geohash from 'latlon-geohash';

// Geohash precision levels (approximate cell sizes):
// 1 = ~5,000km x 5,000km (continent)
// 2 = ~1,250km x 625km (large country)
// 3 = ~156km x 156km (state/province)
// 4 = ~39km x 19km (city level)
// 5 = ~5km x 5km (district level)
// 6 = ~1.2km x 600m (neighborhood level)
// 7 = ~150m x 150m (street level)
// 8 = ~38m x 19m (building level)
// 9 = ~5m x 5m (parking spot level)

export const PRECISION = {
  CONTINENT: 1,
  COUNTRY: 2,
  STATE: 3,
  CITY: 4,
  DISTRICT: 5,
  NEIGHBORHOOD: 6,
  STREET: 7,
  BUILDING: 8,
  PRECISE: 9,
} as const;

export type PrecisionLevel = typeof PRECISION[keyof typeof PRECISION];

/**
 * Encode latitude/longitude to geohash string
 * Default precision 7 gives ~150m accuracy (street level)
 */
export function encodeGeohash(
  lat: number,
  lon: number,
  precision: PrecisionLevel = PRECISION.STREET
): string {
  return Geohash.encode(lat, lon, precision);
}

/**
 * Decode geohash string back to coordinates
 * Returns center point of the geohash cell
 */
export function decodeGeohash(hash: string): { lat: number; lon: number } {
  return Geohash.decode(hash);
}

/**
 * Get bounds of a geohash cell
 */
export function getGeohashBounds(hash: string): {
  sw: { lat: number; lon: number };
  ne: { lat: number; lon: number };
} {
  const bounds = Geohash.bounds(hash);
  return {
    sw: { lat: bounds.sw.lat, lon: bounds.sw.lon },
    ne: { lat: bounds.ne.lat, lon: bounds.ne.lon },
  };
}

/**
 * Get all 8 neighboring geohashes (n, ne, e, se, s, sw, w, nw)
 */
export function getNeighbors(hash: string): Record<string, string> {
  const neighbors = Geohash.neighbours(hash);
  return { ...neighbors } as Record<string, string>;
}

/**
 * Get geohash and all its neighbors (9 cells total)
 * Useful for "nearby" queries to avoid edge effects
 */
export function getGeohashWithNeighbors(hash: string): string[] {
  const neighbors = getNeighbors(hash);
  return [hash, ...Object.values(neighbors)];
}

/**
 * Get appropriate precision based on search radius
 * Smaller radius = higher precision needed
 */
export function getPrecisionForRadius(radiusKm: number): PrecisionLevel {
  if (radiusKm > 100) return PRECISION.STATE;
  if (radiusKm > 20) return PRECISION.CITY;
  if (radiusKm > 5) return PRECISION.DISTRICT;
  if (radiusKm > 1) return PRECISION.NEIGHBORHOOD;
  if (radiusKm > 0.2) return PRECISION.STREET;
  return PRECISION.BUILDING;
}

/**
 * Get all geohashes that cover a circular area
 * Used for proximity queries without expensive distance calculations
 */
export function getGeohashesInRadius(
  lat: number,
  lon: number,
  radiusKm: number
): string[] {
  const precision = getPrecisionForRadius(radiusKm);
  const centerHash = encodeGeohash(lat, lon, precision);

  // For small radii, just use center + neighbors
  if (radiusKm <= 5) {
    return getGeohashWithNeighbors(centerHash);
  }

  // For larger radii, we need to expand further
  // Get neighbors of neighbors for better coverage
  const allHashes = new Set<string>();
  allHashes.add(centerHash);

  const firstLevelNeighbors = getGeohashWithNeighbors(centerHash);
  firstLevelNeighbors.forEach(h => {
    allHashes.add(h);
    if (radiusKm > 10) {
      // Add second level neighbors for large radii
      getGeohashWithNeighbors(h).forEach(h2 => allHashes.add(h2));
    }
  });

  return Array.from(allHashes);
}

/**
 * Check if two coordinates are in the same geohash cell
 * Useful for deduplication and clustering
 */
export function isSameGeohashCell(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  precision: PrecisionLevel = PRECISION.BUILDING
): boolean {
  return encodeGeohash(lat1, lon1, precision) === encodeGeohash(lat2, lon2, precision);
}

/**
 * Get geohash prefix for SQL LIKE queries
 * Returns array of patterns for use with: geohash LIKE ANY(patterns)
 */
export function getGeohashPatternsForQuery(
  lat: number,
  lon: number,
  radiusKm: number
): string[] {
  const hashes = getGeohashesInRadius(lat, lon, radiusKm);
  // Add wildcard for prefix matching
  return hashes.map(h => `${h}%`);
}

/**
 * Calculate approximate distance between two geohash centers
 * Much faster than Haversine for rough estimates
 */
export function approximateGeohashDistance(hash1: string, hash2: string): number {
  const pos1 = decodeGeohash(hash1);
  const pos2 = decodeGeohash(hash2);
  return haversineDistance(pos1.lat, pos1.lon, pos2.lat, pos2.lon);
}

/**
 * Haversine distance calculation (km)
 * Used when exact distance is needed
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}
