// OpenRouteService Routing Service
// Professional pedestrian routing with true walking paths

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
const API_KEY = process.env.EXPO_PUBLIC_OPENROUTESERVICE_API_KEY;
const ORS_BASE_URL = "https://api.openrouteservice.org/v2";

// OpenRouteService API Response Types
interface ORSManeuver {
  type: number;
  modifier?: number;
  location: [number, number];
  bearing_after?: number;
  bearing_before?: number;
}

interface ORSStep {
  distance: number;
  duration: number;
  instruction: string;
  name: string;
  type: number;
  way_points: [number, number];
  maneuver: ORSManeuver;
}

interface ORSSegment {
  distance: number;
  duration: number;
  steps: ORSStep[];
}


interface ORSResponse {
  type: string;
  features: {
    type: string;
    geometry: {
      coordinates: [number, number][];
      type: string;
    };
    properties: {
      segments: ORSSegment[];
      summary: {
        distance: number;
        duration: number;
      };
      way_points: number[];
    };
  }[];
  bbox: number[];
  metadata: {
    attribution: string;
    service: string;
    timestamp: number;
    query: unknown;
    engine: {
      version: string;
      build_date: string;
    };
  };
}

/**
 * Get routes for walking/cycling using OpenRouteService
 * @param coordinates Array of {latitude, longitude} pairs
 * @param profile 'foot-walking', 'cycling-regular'
 * @param alternatives Number of alternative routes (0-2)
 */
export async function getRoute(
  coordinates: { latitude: number; longitude: number }[],
  profile: "foot-walking" | "cycling-regular" = "foot-walking",
  alternatives: number = 1,
): Promise<Route[]> {
  if (coordinates.length < 2) {
    throw new Error("At least 2 coordinates are required for routing");
  }

  // Return mock routes if no API key
  if (!API_KEY) {
    console.warn(
      "OpenRouteService API key not configured. Using mock routes for development.",
    );
    throw new Error("OpenRouteService API key not configured");
  }

  try {
    // Format coordinates as [[lon,lat], [lon,lat], ...]
    const coords = coordinates.map((coord) => [
      coord.longitude,
      coord.latitude,
    ]);

    const requestBody = {
      coordinates: coords,
      radiuses: coordinates.map(() => -1), // Use all roads
      instructions: true,
      preference: "recommended", // Balance between fastest and safest
      units: "m",
      language: "en",
      geometry: true,
      instructions_format: "text",
      alternative_routes: {
        share_factor: 0.6,
        target_count: Math.min(alternatives, 2),
        weight_factor: 1.4,
      },
    };

    const url = `${ORS_BASE_URL}/directions/${profile}/geojson`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json, application/geo+json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401 || response.status === 403) {
        console.warn("Invalid OpenRouteService API key:", errorText);
        throw new Error("Invalid API key");
      }
      console.warn(
        `OpenRouteService API error: ${response.statusText}`,
        errorText,
      );
      throw new Error(`API error: ${response.statusText}`);
    }

    const data: ORSResponse = await response.json();

    if (!data.features || data.features.length === 0) {
      console.warn("OpenRouteService returned no routes");
      throw new Error("No routes found");
    }

    return data.features.map((feature, index) => ({
      id: `route-${index}`,
      name: index === 0 ? "Recommended Route" : `Alternative ${index}`,
      coordinates: feature.geometry.coordinates.map(
        (coord: [number, number]) => ({
          latitude: coord[1],
          longitude: coord[0],
        }),
      ),
      distance: feature.properties.summary.distance,
      duration: feature.properties.summary.duration,
      steps:
        feature.properties.segments[0]?.steps?.map((step: ORSStep) => ({
          instruction: step.instruction || "Continue",
          distance: step.distance,
          duration: step.duration,
          name: step.name || "",
          maneuver: {
            type: step.maneuver ? getManeuverType(step.maneuver.type) : "continue",
            modifier: step.maneuver?.modifier
              ? getManeuverModifier(step.maneuver.modifier)
              : undefined,
            location: step.maneuver?.location ? {
              latitude: step.maneuver.location[1],
              longitude: step.maneuver.location[0],
            } : undefined,
          },
        })) || [],
      geometry: JSON.stringify(feature.geometry.coordinates),
    }));
  } catch (error) {
    console.error("OpenRouteService routing error:", error);
    throw error;
  }
}

/**
 * Get human-readable maneuver type
 */
function getManeuverType(type: number): string {
  const types: Record<number, string> = {
    0: "depart",
    1: "turn",
    2: "turn",
    3: "turn",
    4: "arrive",
    5: "merge",
    6: "ramp",
    7: "roundabout",
    8: "continue",
    9: "fork",
    10: "notification",
  };
  return types[type] || "continue";
}

/**
 * Get human-readable maneuver modifier
 */
function getManeuverModifier(modifier: number): string {
  const modifiers: Record<number, string> = {
    0: "straight",
    1: "slight right",
    2: "right",
    3: "sharp right",
    4: "slight left",
    5: "left",
    6: "sharp left",
    7: "uturn",
  };
  return modifiers[modifier] || "";
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
