import Supercluster, { PointFeature, ClusterFeature } from 'supercluster';
import { Tip } from './tipsService';

export interface TipPoint extends PointFeature<Tip> {
  type: 'Feature';
  properties: Tip;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface TipCluster extends ClusterFeature<Tip> {
  type: 'Feature';
  properties: Tip & {
    cluster: true;
    cluster_id: number;
    point_count: number;
    point_count_abbreviated: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export type ClusterOrPoint = TipPoint | TipCluster;

// Enhanced cache with LRU eviction to prevent memory leaks
interface ClusterCacheEntry {
  tips: Tip[];
  cluster: Supercluster;
  timestamp: number;
  size: number; // Approximate memory size in MB
}

let clusterCache: ClusterCacheEntry | null = null;

const CLUSTER_CACHE_TTL = 300000; // 5 minutes (increased from 1 min)
const MAX_CACHE_SIZE_MB = 10; // Limit cache to 10MB

/**
 * Create a Supercluster instance for tip clustering (with caching)
 */
export function createTipCluster(tips: Tip[]): Supercluster {
  // Check if we can reuse cached cluster
  if (clusterCache && Date.now() - clusterCache.timestamp < CLUSTER_CACHE_TTL) {
    // Compare tips arrays to see if they're the same
    if (
      clusterCache.tips.length === tips.length &&
      clusterCache.tips.every((cachedTip, index) => cachedTip.id === tips[index]?.id)
    ) {
      return clusterCache.cluster;
    }
  }

  const cluster = new Supercluster({
    radius: 60, // Cluster radius in pixels
    maxZoom: 16, // Max zoom to cluster points
    minZoom: 0,
    minPoints: 2, // Minimum points to form a cluster
  });

  // Convert tips to GeoJSON features
  const points: TipPoint[] = tips.map((tip) => ({
    type: 'Feature',
    properties: tip,
    geometry: {
      type: 'Point',
      coordinates: [tip.longitude, tip.latitude],
    },
  }));

  cluster.load(points);

  // Estimate cache size (rough approximation)
  const estimatedSize = (tips.length * 0.001); // ~1KB per tip

  // Update cache with size tracking
  clusterCache = {
    tips,
    cluster,
    timestamp: Date.now(),
    size: estimatedSize,
  };

  return cluster;
}

// LRU cache for viewport clusters with automatic eviction
interface ViewportCacheEntry {
  bounds: { west: number; south: number; east: number; north: number };
  zoom: number;
  clusters: ClusterOrPoint[];
  timestamp: number;
}

const viewportCacheMap = new Map<string, ViewportCacheEntry>();
const MAX_VIEWPORT_CACHE_ENTRIES = 10; // LRU limit

const VIEWPORT_CACHE_TTL = 200; // 200ms - short cache for smooth panning
const MAX_POINTS_PER_VIEWPORT = 300; // Limit points to prevent performance issues

/**
 * Generate cache key for viewport
 */
function getViewportCacheKey(
  bounds: { west: number; south: number; east: number; north: number },
  zoom: number
): string {
  return `${bounds.west.toFixed(4)}_${bounds.south.toFixed(4)}_${bounds.east.toFixed(4)}_${bounds.north.toFixed(4)}_${zoom}`;
}

/**
 * Get clusters or individual points for the current map viewport (with caching & limits)
 */
export function getClustersForViewport(
  cluster: Supercluster,
  bounds: { west: number; south: number; east: number; north: number },
  zoom: number
): ClusterOrPoint[] {
  const flooredZoom = Math.floor(zoom);
  const cacheKey = getViewportCacheKey(bounds, flooredZoom);

  // Check LRU cache
  const cached = viewportCacheMap.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < VIEWPORT_CACHE_TTL) {
    // Move to end (mark as recently used)
    viewportCacheMap.delete(cacheKey);
    viewportCacheMap.set(cacheKey, cached);
    return cached.clusters;
  }

  // Supercluster expects [west, south, east, north] format
  const bbox: [number, number, number, number] = [
    bounds.west,
    bounds.south,
    bounds.east,
    bounds.north,
  ];

  // Get clusters/points for the current viewport
  let clusters = cluster.getClusters(bbox, flooredZoom) as ClusterOrPoint[];

  // Limit points if too many (prioritize clusters over individual points)
  if (clusters.length > MAX_POINTS_PER_VIEWPORT) {
    const clusterPoints = clusters.filter(isCluster);
    const individualPoints = clusters.filter((c) => !isCluster(c));

    if (clusterPoints.length < MAX_POINTS_PER_VIEWPORT) {
      // Include all clusters and remaining individual points
      const remainingSpace = MAX_POINTS_PER_VIEWPORT - clusterPoints.length;
      clusters = [...clusterPoints, ...individualPoints.slice(0, remainingSpace)];
    } else {
      // Too many clusters, just show clusters
      clusters = clusterPoints.slice(0, MAX_POINTS_PER_VIEWPORT);
    }
  }

  // Add to LRU cache with eviction
  if (viewportCacheMap.size >= MAX_VIEWPORT_CACHE_ENTRIES) {
    // Remove oldest entry (first in map)
    const firstKey = viewportCacheMap.keys().next().value;
    if (firstKey) {
      viewportCacheMap.delete(firstKey);
    }
  }

  viewportCacheMap.set(cacheKey, {
    bounds,
    zoom: flooredZoom,
    clusters,
    timestamp: Date.now(),
  });

  return clusters;
}

/**
 * Check if a cluster/point is a cluster
 */
export function isCluster(item: ClusterOrPoint): item is TipCluster {
  return 'cluster' in item.properties && item.properties.cluster === true;
}

/**
 * Get the tips that belong to a cluster
 */
export function getClusterChildren(
  cluster: Supercluster,
  clusterId: number,
  _zoom: number
): Tip[] {
  try {
    const leaves = cluster.getLeaves(clusterId, Infinity);
    return leaves.map((leaf) => (leaf as TipPoint).properties);
  } catch (error) {
    console.error('Error getting cluster children:', error);
    return [];
  }
}

/**
 * Clear all clustering caches (call when tips data changes)
 */
export function clearClusteringCaches(): void {
  clusterCache = null;
  viewportCacheMap.clear();
}

/**
 * Perform periodic cache cleanup to remove expired entries
 * Call this from your main component (e.g., in a setInterval)
 */
export function performCacheCleanup(): void {
  const now = Date.now();

  // Clear expired cluster cache
  if (clusterCache && now - clusterCache.timestamp > CLUSTER_CACHE_TTL) {
    console.log('[Cache] Clearing expired cluster cache');
    clusterCache = null;
  }

  // Clear expired viewport caches
  let removedCount = 0;
  for (const [key, entry] of viewportCacheMap.entries()) {
    if (now - entry.timestamp > VIEWPORT_CACHE_TTL) {
      viewportCacheMap.delete(key);
      removedCount++;
    }
  }

  if (removedCount > 0) {
    console.log(`[Cache] Removed ${removedCount} expired viewport cache entries`);
  }

  // Log cache stats for monitoring
  const cacheSize = clusterCache?.size || 0;
  if (cacheSize > MAX_CACHE_SIZE_MB) {
    console.warn(`[Cache] Cluster cache size (${cacheSize.toFixed(2)}MB) exceeds limit (${MAX_CACHE_SIZE_MB}MB)`);
    clusterCache = null;
  }
}

/**
 * Calculate zoom level from region delta (optimized)
 */
export function calculateZoomFromDelta(latitudeDelta: number): number {
  // Approximate zoom level calculation
  // latitudeDelta ~= 360 / (2^zoom)
  // Clamp to valid range first to avoid unnecessary Math operations
  if (latitudeDelta >= 360) return 0;
  if (latitudeDelta <= 0.000001) return 20;

  const zoom = Math.log2(360 / latitudeDelta);
  return Math.max(0, Math.min(20, zoom));
}

/**
 * Get category breakdown for a cluster
 */
export function getClusterCategoryBreakdown(tips: Tip[]): Record<string, number> {
  const breakdown: Record<string, number> = {
    lighting: 0,
    harassment: 0,
    transit: 0,
    safe_haven: 0,
    construction: 0,
  };

  tips.forEach((tip) => {
    if (breakdown[tip.category] !== undefined) {
      breakdown[tip.category]++;
    }
  });

  return breakdown;
}

/**
 * Get the dominant category in a cluster
 */
export function getDominantCategory(tips: Tip[]): string {
  const breakdown = getClusterCategoryBreakdown(tips);
  let maxCount = 0;
  let dominantCategory = 'lighting';

  Object.entries(breakdown).forEach(([category, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantCategory = category;
    }
  });

  return dominantCategory;
}
