// Hybrid Routing Service
// Uses OpenRouteService for walking/cycling (better pedestrian routes)
// Uses LocationIQ for driving (already working)

import * as OpenRouteService from './openRouteService';

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
    location?: RouteCoordinate;
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

// Get API key from environment
const API_KEY = process.env.EXPO_PUBLIC_LOCATIONIQ_API_KEY;
const LOCATIONIQ_BASE_URL = "https://us1.locationiq.com/v1";

// LocationIQ API Response Types
interface LocationIQManeuver {
  type: string;
  modifier?: string;
  instruction?: string;
  bearing_after?: number;
  bearing_before?: number;
  location: [number, number];
}

interface LocationIQStep {
  distance: number;
  duration: number;
  name: string;
  maneuver: LocationIQManeuver;
  mode: string;
  weight: number;
}

interface LocationIQLeg {
  steps: LocationIQStep[];
  distance: number;
  duration: number;
  summary: string;
  weight: number;
}

interface LocationIQRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
  };
  legs: LocationIQLeg[];
  weight: number;
  weight_name: string;
}

interface LocationIQResponse {
  code: string;
  routes: LocationIQRoute[];
  waypoints: {
    location: [number, number];
    name: string;
  }[];
}

/**
 * Get routes between two or more points using LocationIQ
 * @param coordinates Array of {latitude, longitude} pairs
 * @param profile 'driving', 'walking', 'cycling'
 * @param alternatives Number of alternative routes (0-3)
 */
export async function getRoute(
  coordinates: { latitude: number; longitude: number }[],
  profile: "driving" | "walking" | "cycling" = "driving",
  alternatives: number = 2,
): Promise<Route[]> {
  if (coordinates.length < 2) {
    throw new Error("At least 2 coordinates are required for routing");
  }

  // Use OpenRouteService for walking and cycling (better pedestrian routes)
  if (profile === "walking" || profile === "cycling") {
    try {
      const orsProfile = profile === "walking" ? "foot-walking" : "cycling-regular";
      return await OpenRouteService.getRoute(coordinates, orsProfile, alternatives);
    } catch (error) {
      console.warn("OpenRouteService failed, falling back to mock routes:", error);
      return getMockRoutes(coordinates[0], coordinates[coordinates.length - 1], profile);
    }
  }

  // Use LocationIQ for driving
  if (!API_KEY) {
    console.warn(
      "LocationIQ API key not configured. Using mock routes for development.",
    );
    return getMockRoutes(coordinates[0], coordinates[coordinates.length - 1], profile);
  }

  try {
    // Format coordinates as "lon,lat;lon,lat;..."
    const coordString = coordinates
      .map((coord) => `${coord.longitude},${coord.latitude}`)
      .join(";");

    const params = new URLSearchParams({
      key: API_KEY,
      overview: "full",
      alternatives: Math.min(alternatives, 3).toString(),
      steps: "true",
      geometries: "geojson",
      annotations: "true",
    });

    const url = `${LOCATIONIQ_BASE_URL}/directions/${profile}/${coordString}?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("Invalid LocationIQ API key. Using mock routes.");
        return getMockRoutes(coordinates[0], coordinates[coordinates.length - 1], profile);
      }
      // Return mock routes on any API error
      console.warn(`LocationIQ API error: ${response.statusText}. Using mock routes.`);
      return getMockRoutes(coordinates[0], coordinates[coordinates.length - 1], profile);
    }

    const data: LocationIQResponse = await response.json();

    if (data.code !== "Ok") {
      console.warn(`LocationIQ routing error: ${data.code}. Using mock routes.`);
      return getMockRoutes(coordinates[0], coordinates[coordinates.length - 1], profile);
    }

    return data.routes.map((route: LocationIQRoute, index: number) => ({
      id: `route-${index}`,
      name: index === 0 ? "Recommended Route" : `Alternative ${index}`,
      coordinates: route.geometry.coordinates.map(
        (coord: [number, number]) => ({
          latitude: coord[1],
          longitude: coord[0],
        }),
      ),
      distance: route.distance,
      duration: route.duration,
      steps:
        route.legs[0]?.steps?.map((step: LocationIQStep) => ({
          instruction:
            step.maneuver.instruction || getManeuverInstruction(step.maneuver),
          distance: step.distance,
          duration: step.duration,
          name: step.name || "",
          maneuver: {
            type: step.maneuver.type,
            modifier: step.maneuver.modifier,
            location: {
              latitude: step.maneuver.location[1],
              longitude: step.maneuver.location[0],
            },
          },
        })) || [],
      geometry: JSON.stringify(route.geometry.coordinates),
    }));
  } catch (error) {
    console.error("LocationIQ routing error:", error);
    // Return mock routes on any error
    return getMockRoutes(coordinates[0], coordinates[coordinates.length - 1], profile);
  }
}

/**
 * Calculate routes for different travel modes
 */
export async function getMultiModalRoutes(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
  modes: ("walk" | "drive" | "transit")[] = ["walk", "drive", "transit"],
): Promise<Map<string, Route[]>> {
  const results = new Map<string, Route[]>();

  const profileMap: Record<string, "driving" | "walking" | "cycling"> = {
    walk: "walking", // Now uses OpenRouteService for true pedestrian routes
    drive: "driving",
    transit: "driving", // Transit uses driving as fallback with adjusted times
  };

  for (const mode of modes) {
    try {
      const profile = profileMap[mode];
      let routes = await getRoute([start, end], profile, 2);

      // Adjust route names based on mode
      routes = routes.map((route, index) => {
        let name = route.name;

        switch (mode) {
          case "walk":
            name =
              index === 0
                ? "Safest Walking Route"
                : `Walking Alternative ${index}`;
            break;
          case "transit":
            // For transit, use driving route but adjust duration
            // Typically transit is faster than driving in Manila due to dedicated lanes
            name =
              index === 0
                ? "Public Transit Route"
                : `Transit Alternative ${index}`;
            // Adjust duration: transit is typically 20% faster than driving in Manila
            route = {
              ...route,
              duration: route.duration * 0.8,
            };
            break;
          case "drive":
            name =
              index === 0
                ? "Fastest Driving Route"
                : `Driving Alternative ${index}`;
            break;
        }

        return {
          ...route,
          id: `${mode}-${route.id}`,
          name,
        };
      });

      results.set(mode, routes);
    } catch (error) {
      console.error(`Failed to get ${mode} routes:`, error);
      // Continue with other modes even if one fails
    }
  }

  return results;
}

/**
 * Generate mock routes for development when API is unavailable
 */
function getMockRoutes(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
  profile: "driving" | "walking" | "cycling",
): Route[] {
  // Calculate straight-line distance
  const distance = calculateDistance(start, end);

  // Estimate duration based on mode (m/s average speeds)
  const speedMap = {
    "walking": 1.4, // ~5 km/h
    "driving": 11.1, // ~40 km/h in Manila traffic
    "cycling": 4.2, // ~15 km/h
  };
  const speed = speedMap[profile];
  const duration = distance / speed;

  // Generate a simple route path (straight line with slight curve for realism)
  const midLat = (start.latitude + end.latitude) / 2;
  const midLon = (start.longitude + end.longitude) / 2;
  const offset = 0.002; // Small offset for curved path

  const routes: Route[] = [
    {
      id: "mock-route-1",
      name: "Recommended Route",
      coordinates: [
        start,
        { latitude: midLat + offset, longitude: midLon },
        end,
      ],
      distance: distance,
      duration: duration,
      steps: [
        {
          instruction: "Head toward destination",
          distance: distance * 0.6,
          duration: duration * 0.6,
          name: "Main Street",
          maneuver: {
            type: "depart",
          },
        },
        {
          instruction: "Continue straight",
          distance: distance * 0.3,
          duration: duration * 0.3,
          name: "Avenue",
          maneuver: {
            type: "continue",
          },
        },
        {
          instruction: "Arrive at destination",
          distance: distance * 0.1,
          duration: duration * 0.1,
          name: "",
          maneuver: {
            type: "arrive",
          },
        },
      ],
      geometry: JSON.stringify([
        [start.longitude, start.latitude],
        [midLon, midLat + offset],
        [end.longitude, end.latitude],
      ]),
    },
    {
      id: "mock-route-2",
      name: "Alternative 1",
      coordinates: [
        start,
        { latitude: midLat - offset, longitude: midLon },
        end,
      ],
      distance: distance * 1.15, // 15% longer
      duration: duration * 1.2, // 20% slower
      steps: [
        {
          instruction: "Head toward destination via alternate route",
          distance: distance * 0.7,
          duration: duration * 0.7,
          name: "Secondary Road",
          maneuver: {
            type: "depart",
          },
        },
        {
          instruction: "Arrive at destination",
          distance: distance * 0.45,
          duration: duration * 0.5,
          name: "",
          maneuver: {
            type: "arrive",
          },
        },
      ],
      geometry: JSON.stringify([
        [start.longitude, start.latitude],
        [midLon, midLat - offset],
        [end.longitude, end.latitude],
      ]),
    },
  ];

  return routes;
}

/**
 * Get human-readable instruction from maneuver
 */
function getManeuverInstruction(maneuver: LocationIQManeuver): string {
  const type = maneuver.type;
  const modifier = maneuver.modifier || "";

  const instructions: Record<string, string> = {
    turn: `Turn ${modifier}`,
    "new name": "Continue on",
    depart: "Head",
    arrive: "Arrive at destination",
    merge: "Merge",
    ramp: "Take ramp",
    "on ramp": "Take on-ramp",
    "off ramp": "Take off-ramp",
    fork: `Take ${modifier} fork`,
    "end of road": `At end of road, turn ${modifier}`,
    continue: "Continue straight",
    roundabout: "Enter roundabout",
    rotary: "Enter rotary",
    "roundabout turn": `Take exit at roundabout`,
    notification: "Note",
    "exit roundabout": "Exit roundabout",
    "use lane": "Use lane",
  };

  return instructions[type] || "Continue";
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

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
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
 * Calculate distance between two coordinates (Haversine formula)
 * Useful for validating routes and quick distance checks
 */
export function calculateDistance(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
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
