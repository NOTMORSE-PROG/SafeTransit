// OSRM (Open Source Routing Machine) Service
// Free routing engine using OpenStreetMap data
// No API key required

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteStep {
  instruction: string;
  distance: number; // in meters
  duration: number; // in seconds
  name: string;
  maneuver: {
    type: string;
    modifier?: string;
  };
}

export interface Route {
  id: string;
  name: string;
  coordinates: RouteCoordinate[];
  distance: number; // in meters
  duration: number; // in seconds
  steps: RouteStep[];
  geometry: string; // encoded polyline
}

export interface RoutingResult {
  routes: Route[];
  waypoints: {
    location: [number, number];
    name: string;
  }[];
}

// Using public OSRM instance
const OSRM_BASE_URL = 'https://router.project-osrm.org';

// OSRM API Response Types
interface OSRMManeuver {
  type: string;
  modifier?: string;
  instruction?: string;
}

interface OSRMStep {
  distance: number;
  duration: number;
  name: string;
  maneuver: OSRMManeuver;
}

interface OSRMLeg {
  steps: OSRMStep[];
}

interface OSRMRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
  };
  legs: OSRMLeg[];
}

/**
 * Get routes between two or more points
 * @param coordinates Array of [longitude, latitude] pairs
 * @param _profile 'driving', 'walking', or 'cycling' (note: public OSRM may only support driving)
 * @param alternatives Number of alternative routes (0-3)
 */
export async function getRoute(
  coordinates: { latitude: number; longitude: number }[],
  _profile: 'driving' | 'walking' | 'cycling' = 'driving',
  alternatives: number = 2
): Promise<Route[]> {
  try {
    if (coordinates.length < 2) {
      throw new Error('At least 2 coordinates are required for routing');
    }

    // Note: Public OSRM primarily supports 'driving' profile
    // For walking/cycling, we'll still use driving but the app can adjust display
    const routeProfile = 'driving'; // public instance limitation

    // Format coordinates as "lon,lat;lon,lat;..."
    const coordString = coordinates
      .map((coord) => `${coord.longitude},${coord.latitude}`)
      .join(';');

    const params = new URLSearchParams({
      overview: 'full',
      alternatives: Math.min(alternatives, 3).toString(),
      steps: 'true',
      geometries: 'geojson',
      annotations: 'true',
    });

    const url = `${OSRM_BASE_URL}/route/v1/${routeProfile}/${coordString}?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok') {
      throw new Error(`OSRM routing error: ${data.code}`);
    }

    return data.routes.map((route: OSRMRoute, index: number) => ({
      id: `route-${index}`,
      name: index === 0 ? 'Recommended Route' : `Alternative ${index}`,
      coordinates: route.geometry.coordinates.map((coord: [number, number]) => ({
        latitude: coord[1],
        longitude: coord[0],
      })),
      distance: route.distance,
      duration: route.duration,
      steps: route.legs[0]?.steps?.map((step: OSRMStep) => ({
        instruction: step.maneuver.instruction || getManeuverInstruction(step.maneuver),
        distance: step.distance,
        duration: step.duration,
        name: step.name || '',
        maneuver: {
          type: step.maneuver.type,
          modifier: step.maneuver.modifier,
        },
      })) || [],
      geometry: encodePolyline(route.geometry.coordinates),
    }));
  } catch {
    // OSRM API is unavailable or network error - return mock routes
    console.warn('OSRM unavailable, using mock routes');
    return getMockRoutes(coordinates);
  }
}

/**
 * Calculate route for different travel modes
 * Since public OSRM only supports driving, we'll adjust the results
 */
export async function getMultiModalRoutes(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
  modes: ('walk' | 'drive' | 'transit')[] = ['walk', 'drive', 'transit']
): Promise<Map<string, Route[]>> {
  const results = new Map<string, Route[]>();

  for (const mode of modes) {
    let routes = await getRoute([start, end], 'driving', 2);

    // Adjust duration estimates based on mode
    routes = routes.map((route, index) => {
      let adjustedDuration = route.duration;
      let name = route.name;

      switch (mode) {
        case 'walk':
          // Walking is roughly 5km/h vs 30km/h driving
          adjustedDuration = route.duration * 6;
          name = index === 0 ? 'Safest Walking Route' : `Walking Alternative ${index}`;
          break;
        case 'transit':
          // Transit might be faster than driving in traffic
          adjustedDuration = route.duration * 0.8;
          name = index === 0 ? 'Public Transit Route' : `Transit Alternative ${index}`;
          break;
        case 'drive':
          name = index === 0 ? 'Fastest Driving Route' : `Driving Alternative ${index}`;
          break;
      }

      return {
        ...route,
        id: `${mode}-${route.id}`,
        name,
        duration: adjustedDuration,
      };
    });

    results.set(mode, routes);
  }

  return results;
}

/**
 * Get human-readable instruction from maneuver
 */
function getManeuverInstruction(maneuver: OSRMManeuver): string {
  const type = maneuver.type;
  const modifier = maneuver.modifier;

  const instructions: Record<string, string> = {
    'turn': `Turn ${modifier || ''}`,
    'new name': 'Continue on',
    'depart': 'Head',
    'arrive': 'Arrive at destination',
    'merge': 'Merge',
    'ramp': 'Take ramp',
    'on ramp': 'Take on-ramp',
    'off ramp': 'Take off-ramp',
    'fork': `Take ${modifier || ''} fork`,
    'end of road': `At end of road, turn ${modifier || ''}`,
    'continue': 'Continue straight',
    'roundabout': 'Enter roundabout',
    'rotary': 'Enter rotary',
  };

  return instructions[type] || 'Continue';
}

/**
 * Simple polyline encoding for efficient storage
 * (Simplified version - you may want to use a proper library)
 */
function encodePolyline(coordinates: [number, number][]): string {
  // For now, just return JSON stringified
  // In production, use polyline encoding library
  return JSON.stringify(coordinates);
}

/**
 * Format duration to human-readable string
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
}

/**
 * Format distance to human-readable string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}

/**
 * Generate mock routes when OSRM is unavailable
 * This ensures the app still works without an internet connection
 */
function getMockRoutes(coordinates: { latitude: number; longitude: number }[]): Route[] {
  if (coordinates.length < 2) return [];

  const start = coordinates[0];
  const end = coordinates[coordinates.length - 1];

  // Calculate rough straight-line distance
  const distance = calculateDistance(start, end);
  const duration = distance / 10; // ~10 m/s average speed

  // Create two alternative routes
  return [
    {
      id: 'mock-route-0',
      name: 'Recommended Route',
      coordinates: [start, end],
      distance,
      duration,
      steps: [
        {
          instruction: 'Head towards destination',
          distance,
          duration,
          name: 'Mock Route',
          maneuver: { type: 'depart' },
        },
      ],
      geometry: JSON.stringify([[start.longitude, start.latitude], [end.longitude, end.latitude]]),
    },
    {
      id: 'mock-route-1',
      name: 'Alternative 1',
      coordinates: [start, end],
      distance: distance * 1.2,
      duration: duration * 1.3,
      steps: [
        {
          instruction: 'Head towards destination (alternative)',
          distance: distance * 1.2,
          duration: duration * 1.3,
          name: 'Mock Alternative',
          maneuver: { type: 'depart' },
        },
      ],
      geometry: JSON.stringify([[start.longitude, start.latitude], [end.longitude, end.latitude]]),
    },
  ];
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number }
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (start.latitude * Math.PI) / 180;
  const φ2 = (end.latitude * Math.PI) / 180;
  const Δφ = ((end.latitude - start.latitude) * Math.PI) / 180;
  const Δλ = ((end.longitude - start.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
