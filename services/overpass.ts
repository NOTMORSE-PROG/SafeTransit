/**
 * Overpass API Service
 * Real-time OpenStreetMap entrance detection
 * FREE with no API key required
 */

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

export interface EntrancePoint {
  id: string;
  type: 'entrance' | 'gate' | 'parking' | 'main';
  latitude: number;
  longitude: number;
  name: string;
  access?: 'private' | 'destination' | 'yes';
  distance_meters?: number;
}

interface OverpassElement {
  id: number;
  lat: number;
  lon: number;
  tags?: {
    entrance?: string;
    amenity?: string;
    barrier?: string;
    name?: string;
    access?: 'private' | 'destination' | 'yes';
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

/**
 * Find building entrances near a location using Overpass API
 * This is FREE and doesn't require any database seeding
 */
export async function findNearbyEntrances(
  latitude: number,
  longitude: number,
  radiusMeters: number = 100
): Promise<EntrancePoint[]> {
  const query = `
    [out:json][timeout:25];
    (
      node["entrance"]["entrance"!="no"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="parking_entrance"](around:${radiusMeters},${latitude},${longitude});
      node["barrier"="gate"]["access"="destination"](around:${radiusMeters},${latitude},${longitude});
    );
    out body;
  `;

  try {
    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = (await response.json()) as OverpassResponse;

    return data.elements.map((element: OverpassElement) => {
      const isMain = element.tags?.entrance === 'main';
      const isParking = element.tags?.amenity === 'parking_entrance';
      const isGate = element.tags?.barrier === 'gate';

      return {
        id: element.id.toString(),
        type: isMain ? 'main' : isParking ? 'parking' : isGate ? 'gate' : 'entrance',
        latitude: element.lat,
        longitude: element.lon,
        name: element.tags?.name || (isMain ? 'Main Entrance' : isParking ? 'Parking Entrance' : 'Entrance'),
        access: element.tags?.access,
      };
    });
  } catch (error) {
    console.error('[Overpass] Error fetching entrances:', error);
    return [];
  }
}

/**
 * Calculate distance between two points in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Get optimal entrance points with distance sorting
 */
export async function getOptimalEntrances(
  destination: { latitude: number; longitude: number },
  _userLocation?: { latitude: number; longitude: number }
): Promise<EntrancePoint[]> {
  const entrances = await findNearbyEntrances(
    destination.latitude,
    destination.longitude,
    100
  );

  const entrancesWithDistance = entrances.map(entrance => ({
    ...entrance,
    distance_meters: calculateDistance(
      entrance.latitude,
      entrance.longitude,
      destination.latitude,
      destination.longitude
    )
  }));

  entrancesWithDistance.sort((a, b) => {
    if (a.type === 'main' && b.type !== 'main') return -1;
    if (a.type !== 'main' && b.type === 'main') return 1;
    return (a.distance_meters || 0) - (b.distance_meters || 0);
  });

  return entrancesWithDistance.slice(0, 5);
}
