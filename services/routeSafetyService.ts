import { Tip, fetchTips } from './tipsService';

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteSegment {
  coordinates: RouteCoordinate[];
  score: number;
  color: string;
  nearbyTips: Tip[];
}

export interface RouteSafetyAnalysis {
  overallScore: number;
  segments: RouteSegment[];
  totalDistance: number;
  dangerZones: number;
}

// Category severity weights (higher = more dangerous)
const CATEGORY_SEVERITY = {
  harassment: 10,
  construction: 3,
  lighting: 5,
  transit: 2,
  safe_haven: -5, // Positive factor (reduces danger)
};

const BUFFER_DISTANCE = 50; // meters - how far from route to consider tips

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
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
 * Calculate bounding box for route coordinates
 */
function calculateBounds(coordinates: RouteCoordinate[]): {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
} {
  const lats = coordinates.map((c) => c.latitude);
  const lons = coordinates.map((c) => c.longitude);

  // Add buffer zone (approximately 0.001 degrees ≈ 100m)
  const buffer = 0.001;

  return {
    minLat: Math.min(...lats) - buffer,
    minLon: Math.min(...lons) - buffer,
    maxLat: Math.max(...lats) + buffer,
    maxLon: Math.max(...lons) + buffer,
  };
}

/**
 * Divide route into segments of approximately segmentLength meters
 */
function createSegments(
  coordinates: RouteCoordinate[],
  segmentLength: number
): RouteCoordinate[][] {
  if (coordinates.length < 2) return [coordinates];

  const segments: RouteCoordinate[][] = [];
  let currentSegment: RouteCoordinate[] = [coordinates[0]];
  let segmentDistance = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    const distance = calculateDistance(
      prev.latitude,
      prev.longitude,
      curr.latitude,
      curr.longitude
    );

    segmentDistance += distance;
    currentSegment.push(curr);

    if (segmentDistance >= segmentLength) {
      segments.push(currentSegment);
      currentSegment = [curr];
      segmentDistance = 0;
    }
  }

  // Add remaining coordinates
  if (currentSegment.length > 1) {
    segments.push(currentSegment);
  }

  return segments;
}

/**
 * Calculate distance from a point to a line segment
 */
function distanceToSegment(
  point: { latitude: number; longitude: number },
  segmentStart: RouteCoordinate,
  segmentEnd: RouteCoordinate
): number {
  // Find closest point on segment to the tip
  const distances = [
    calculateDistance(point.latitude, point.longitude, segmentStart.latitude, segmentStart.longitude),
    calculateDistance(point.latitude, point.longitude, segmentEnd.latitude, segmentEnd.longitude),
  ];

  return Math.min(...distances);
}

/**
 * Find tips near a route segment
 */
function findTipsNearSegment(
  segment: RouteCoordinate[],
  tips: Tip[],
  maxDistance: number
): Tip[] {
  const nearbyTips: Tip[] = [];

  for (const tip of tips) {
    let minDistance = Infinity;

    // Check distance to each point in segment
    for (let i = 0; i < segment.length - 1; i++) {
      const distance = distanceToSegment(
        { latitude: tip.latitude, longitude: tip.longitude },
        segment[i],
        segment[i + 1]
      );
      minDistance = Math.min(minDistance, distance);
    }

    if (minDistance <= maxDistance) {
      nearbyTips.push(tip);
    }
  }

  return nearbyTips;
}

/**
 * Calculate safety score for a route segment (0-100, higher is safer)
 */
function calculateSegmentScore(nearbyTips: Tip[]): number {
  if (nearbyTips.length === 0) return 85; // Default safe score

  let riskWeight = 0;

  for (const tip of nearbyTips) {
    const severity = CATEGORY_SEVERITY[tip.category as keyof typeof CATEGORY_SEVERITY] || 5;
    riskWeight += severity;
  }

  // Convert risk to safety score (0-100)
  const score = Math.max(0, 100 - (riskWeight / 50) * 100);
  return Math.round(score);
}

/**
 * Get color for segment based on safety score
 */
function getSegmentColor(score: number): string {
  if (score >= 70) return '#22C55E'; // Safe - green
  if (score >= 40) return '#F59E0B'; // Caution - amber
  return '#EF4444'; // Danger - red
}

/**
 * Analyze route safety based on nearby tips
 */
export async function analyzeRouteSafety(
  routeCoordinates: RouteCoordinate[]
): Promise<RouteSafetyAnalysis> {
  try {
    // 1. Calculate bounding box for the route
    const bounds = calculateBounds(routeCoordinates);

    // 2. Fetch tips in the route area
    const tips = await fetchTips({
      bounds: `${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon}`,
    });

    // 3. Divide route into segments (~100m each)
    const segments = createSegments(routeCoordinates, 100);

    // 4. Score each segment
    const scoredSegments: RouteSegment[] = segments.map((segment) => {
      const nearbyTips = findTipsNearSegment(segment, tips, BUFFER_DISTANCE);
      const score = calculateSegmentScore(nearbyTips);
      const color = getSegmentColor(score);

      return {
        coordinates: segment,
        score,
        color,
        nearbyTips,
      };
    });

    // 5. Calculate overall statistics
    const totalScore = scoredSegments.reduce((sum, s) => sum + s.score, 0);
    const overallScore = Math.round(totalScore / scoredSegments.length);
    const dangerZones = scoredSegments.filter((s) => s.score < 40).length;

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 1; i < routeCoordinates.length; i++) {
      totalDistance += calculateDistance(
        routeCoordinates[i - 1].latitude,
        routeCoordinates[i - 1].longitude,
        routeCoordinates[i].latitude,
        routeCoordinates[i].longitude
      );
    }

    return {
      overallScore,
      segments: scoredSegments,
      totalDistance: Math.round(totalDistance),
      dangerZones,
    };
  } catch (error) {
    console.error('Error analyzing route safety:', error);
    throw error;
  }
}

/**
 * Get safety rating text based on score
 */
export function getSafetyRating(score: number): {
  text: string;
  color: string;
  emoji: string;
} {
  if (score >= 80) {
    return { text: 'Very Safe', color: '#22C55E', emoji: '✅' };
  } else if (score >= 60) {
    return { text: 'Generally Safe', color: '#84CC16', emoji: '👍' };
  } else if (score >= 40) {
    return { text: 'Use Caution', color: '#F59E0B', emoji: '⚠️' };
  } else {
    return { text: 'High Risk', color: '#EF4444', emoji: '🚨' };
  }
}

/**
 * Aggregate tips by category for display
 */
export interface TipCategorySummary {
  harassment: number;
  lighting: number;
  construction: number;
  transit: number;
  safe_haven: number;
}

export function aggregateTipsByCategory(tips: Tip[]): TipCategorySummary {
  const summary: TipCategorySummary = {
    harassment: 0,
    lighting: 0,
    construction: 0,
    transit: 0,
    safe_haven: 0,
  };

  tips.forEach((tip) => {
    if (tip.category in summary) {
      summary[tip.category as keyof TipCategorySummary]++;
    }
  });

  return summary;
}

/**
 * Get all unique tips from route segments
 */
export function getAllRouteTips(segments: RouteSegment[]): Tip[] {
  const tipMap = new Map<string, Tip>();

  segments.forEach((segment) => {
    segment.nearbyTips.forEach((tip) => {
      tipMap.set(tip.id, tip);
    });
  });

  return Array.from(tipMap.values());
}
