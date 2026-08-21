export type POIType = 'police' | 'hospital' | 'transit';

export type TransitLine = 'MRT-3' | 'LRT-1' | 'LRT-2';

export type POISource = 'osm' | 'curated';

export interface SafetyPOI {
  id: string;
  osm_id?: number | null;
  type: POIType;
  subtype?: TransitLine | string | null;
  name: string;
  address?: string | null;
  phone?: string | null;
  latitude: number;
  longitude: number;
  tags?: Record<string, string | null> | null;
  source: POISource;
  last_refreshed_at?: string;
}

export interface POIFetchParams {
  type?: POIType;
  bounds?: { south: number; west: number; north: number; east: number };
}

export const POI_BBOX = {
  south: 14.4,
  west: 120.8,
  north: 14.8,
  east: 121.2,
} as const;

export function isPOIInBounds(
  poi: Pick<SafetyPOI, 'latitude' | 'longitude'>,
  bounds: { south: number; west: number; north: number; east: number }
): boolean {
  return (
    poi.latitude >= bounds.south &&
    poi.latitude <= bounds.north &&
    poi.longitude >= bounds.west &&
    poi.longitude <= bounds.east
  );
}
