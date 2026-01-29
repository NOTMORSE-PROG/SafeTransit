import React, { useEffect, useState, useRef } from 'react';
import { Polygon } from 'react-native-maps';
import { Region } from 'react-native-maps';
import { colors } from '@/constants/theme';
import {
  getHeatmapFromCache,
  setHeatmapCache,
  type HeatmapZone,
} from '@/services/heatmapCacheService';

// Get API base URL (matches tipsService pattern)
const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (__DEV__) {
    return 'http://localhost:3000';
  }
  return 'https://safetransit.vercel.app';
};

interface SafetyHeatmapProps {
  region: Region;
  visible: boolean;
  onZonesChange?: (zones: HeatmapZone[]) => void;
}

/**
 * Decode geohash to approximate bounding box
 * (Simplified version for visualization)
 */
function geohashToBounds(geohash: string, centerLat: number, centerLon: number) {
  // Geohash precision 8 = ~19m x 19m cell
  const cellSize = 0.0002; // Approximately 19m in degrees

  return [
    { latitude: centerLat - cellSize, longitude: centerLon - cellSize },
    { latitude: centerLat + cellSize, longitude: centerLon - cellSize },
    { latitude: centerLat + cellSize, longitude: centerLon + cellSize },
    { latitude: centerLat - cellSize, longitude: centerLon + cellSize },
  ];
}

/**
 * Get heatmap color based on safety score
 */
function getHeatmapColor(score: number): { fill: string; stroke: string } {
  if (score >= 70) {
    // Safe - green
    return {
      fill: `${colors.safe[500]}26`, // 15% opacity
      stroke: colors.safe[500],
    };
  } else if (score >= 50) {
    // Moderate - yellow-green
    return {
      fill: '#84CC1626',
      stroke: '#84CC16',
    };
  } else if (score >= 30) {
    // Caution - amber
    return {
      fill: `${colors.caution[500]}33`, // 20% opacity
      stroke: colors.caution[500],
    };
  } else {
    // Danger - red
    return {
      fill: `${colors.danger[500]}33`, // 20% opacity
      stroke: colors.danger[500],
    };
  }
}

/**
 * Fetch heatmap zones from API with caching
 */
async function fetchHeatmapZones(
  region: Region,
  signal?: AbortSignal
): Promise<HeatmapZone[]> {
  try {
    // Calculate bounds from region
    const bounds = {
      south: region.latitude - region.latitudeDelta / 2,
      west: region.longitude - region.longitudeDelta / 2,
      north: region.latitude + region.latitudeDelta / 2,
      east: region.longitude + region.longitudeDelta / 2,
    };

    // Check cache first
    const cachedZones = await getHeatmapFromCache(bounds);
    if (cachedZones) {
      console.log(`[SafetyHeatmap] Using cached heatmap with ${cachedZones.length} zones`);
      return cachedZones;
    }

    // Fetch from API
    const boundsParam = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
    const url = `${getApiUrl()}/api/locations/search?mode=heatmap&bounds=${boundsParam}`;

    console.log('[SafetyHeatmap] Fetching heatmap zones from API:', url);

    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success || !Array.isArray(data.zones)) {
      console.warn('[SafetyHeatmap] Invalid API response format:', data);
      return [];
    }

    console.log(`[SafetyHeatmap] Fetched ${data.zones.length} zones from API`);

    // Cache the results
    await setHeatmapCache(bounds, data.zones);

    return data.zones;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[SafetyHeatmap] Fetch aborted');
      return [];
    }
    console.error('[SafetyHeatmap] Error fetching heatmap zones:', error);
    return [];
  }
}

const SafetyHeatmap: React.FC<SafetyHeatmapProps> = ({ region, visible, onZonesChange }) => {
  const [zones, setZones] = useState<HeatmapZone[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (visible) {
      loadHeatmapZones();
    } else {
      // Clear zones when not visible
      setZones([]);
      if (onZonesChange) {
        onZonesChange([]);
      }
    }

    return () => {
      // Cleanup: abort ongoing fetch
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, visible]);

  const loadHeatmapZones = async () => {
    // Abort any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this fetch
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const fetchedZones = await fetchHeatmapZones(region, controller.signal);

      // Only update state if not aborted
      if (!controller.signal.aborted) {
        setZones(fetchedZones);
        if (onZonesChange) {
          onZonesChange(fetchedZones);
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error('[SafetyHeatmap] Error loading heatmap:', error);
        setZones([]);
        if (onZonesChange) {
          onZonesChange([]);
        }
      }
    }
  };

  if (!visible || zones.length === 0) {
    return null;
  }

  return (
    <>
      {zones.map((zone) => {
        const bounds = geohashToBounds(zone.geohash, zone.center_lat, zone.center_lon);
        const { fill, stroke } = getHeatmapColor(zone.safety_score);

        return (
          <Polygon
            key={zone.id}
            coordinates={bounds}
            fillColor={fill}
            strokeColor={stroke}
            strokeWidth={0.5}
            tappable={false}
          />
        );
      })}
    </>
  );
};

export default SafetyHeatmap;
