// Location Patterns Service
// Provides Grab-like smart location suggestions based on user behavior
// Implements time-based, context-aware personalization

import { UserLocationHistoryRepository } from "./repositories/userLocationHistoryRepository";
import { UserSavedPlacesRepository } from "./repositories/userSavedPlacesRepository";
import type { FrequentLocation } from "./repositories/userLocationHistoryRepository";

export interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
  reason: string; // Why this is suggested
  confidence: number; // 0-1 confidence score
  source: "saved" | "frequent" | "time_pattern" | "nearby";
}

interface SuggestionContext {
  currentHour?: number;
  dayOfWeek?: number;
  currentLocation?: { lat: number; lon: number };
}

/**
 * Get personalized location suggestions for user
 * Grab-like smart suggestions based on:
 * - Saved places (home, work, favorites)
 * - Frequent locations
 * - Time-based patterns
 * - Nearby frequent places
 */
export async function getUserSuggestions(
  userId: string,
  context?: SuggestionContext,
  limit: number = 10,
): Promise<LocationSuggestion[]> {
  const suggestions: LocationSuggestion[] = [];
  const currentHour = context?.currentHour ?? new Date().getHours();
  const _dayOfWeek = context?.dayOfWeek ?? new Date().getDay();

  try {
    // 1. Check for saved places (highest priority)
    const savedPlaces = await UserSavedPlacesRepository.getAllByUser(userId);

    // Add home/work based on time of day
    if (currentHour >= 8 && currentHour <= 17) {
      // Work hours - suggest work
      const work = savedPlaces.find((p) => p.label === "work");
      if (work) {
        suggestions.push({
          id: work.id,
          name: work.name,
          address: work.address,
          latitude: work.latitude,
          longitude: work.longitude,
          reason: "Your work location",
          confidence: 0.95,
          source: "saved",
        });
      }
    } else if (currentHour >= 18 || currentHour <= 7) {
      // Evening/night - suggest home
      const home = savedPlaces.find((p) => p.label === "home");
      if (home) {
        suggestions.push({
          id: home.id,
          name: home.name,
          address: home.address,
          latitude: home.latitude,
          longitude: home.longitude,
          reason: "Your home location",
          confidence: 0.95,
          source: "saved",
        });
      }
    }

    // Add frequently used favorites
    const favorites = savedPlaces
      .filter((p) => p.label === "favorite" && p.use_count > 0)
      .sort((a, b) => b.use_count - a.use_count)
      .slice(0, 2);

    favorites.forEach((fav) => {
      if (suggestions.length < limit) {
        suggestions.push({
          id: fav.id,
          name: fav.name,
          address: fav.address,
          latitude: fav.latitude,
          longitude: fav.longitude,
          reason: `Visited ${fav.use_count} times`,
          confidence: 0.8,
          source: "saved",
        });
      }
    });

    // 2. Get time-based frequent locations
    if (suggestions.length < limit) {
      const timeBasedLocations =
        await UserLocationHistoryRepository.getLocationsForTime(
          userId,
          currentHour,
          limit - suggestions.length,
        );

      timeBasedLocations.forEach((loc) => {
        // Skip if already suggested
        if (
          suggestions.some((s) => s.id === (loc.location_id || loc.geohash))
        ) {
          return;
        }

        suggestions.push({
          id: loc.location_id || loc.geohash,
          name: loc.location_name || "Frequent location",
          address:
            loc.location_address || `${loc.center_lat}, ${loc.center_lon}`,
          latitude: loc.center_lat,
          longitude: loc.center_lon,
          reason:
            loc.typical_hour !== null
              ? getTimeBasedReason(currentHour, loc.typical_hour)
              : "You visit here frequently",
          confidence: 0.7,
          source: "time_pattern",
        });
      });
    }

    // 3. Get nearby frequent locations if user location available
    if (suggestions.length < limit && context?.currentLocation) {
      const nearbyFrequent =
        await UserLocationHistoryRepository.getFrequentNearby(
          userId,
          context.currentLocation.lat,
          context.currentLocation.lon,
          5, // 5km radius
          limit - suggestions.length,
        );

      nearbyFrequent.forEach((loc) => {
        if (
          suggestions.some((s) => s.id === (loc.location_id || loc.geohash))
        ) {
          return;
        }

        const distance = calculateDistance(loc);

        suggestions.push({
          id: loc.location_id || loc.geohash,
          name: loc.location_name || "Frequent location",
          address:
            loc.location_address || `${loc.center_lat}, ${loc.center_lon}`,
          latitude: loc.center_lat,
          longitude: loc.center_lon,
          distance_km: distance,
          reason: `Nearby place you visit often`,
          confidence: 0.65,
          source: "nearby",
        });
      });
    }

    // 4. Get general frequent locations
    if (suggestions.length < limit) {
      const frequentLocations =
        await UserLocationHistoryRepository.getFrequentLocations(
          userId,
          limit - suggestions.length,
        );

      frequentLocations.forEach((loc) => {
        if (
          suggestions.some((s) => s.id === (loc.location_id || loc.geohash))
        ) {
          return;
        }

        suggestions.push({
          id: loc.location_id || loc.geohash,
          name: loc.location_name || "Frequent location",
          address:
            loc.location_address || `${loc.center_lat}, ${loc.center_lon}`,
          latitude: loc.center_lat,
          longitude: loc.center_lon,
          reason: `You've been here ${loc.visit_count} times`,
          confidence: 0.6,
          source: "frequent",
        });
      });
    }

    return suggestions.slice(0, limit);
  } catch (error) {
    console.error("Failed to get user suggestions:", error);
    return [];
  }
}

/**
 * Detect likely home and work locations from patterns
 * Grab uses this to suggest setting home/work if not set
 */
export async function suggestHomeWorkLocations(userId: string): Promise<{
  suggestedHome: LocationSuggestion | null;
  suggestedWork: LocationSuggestion | null;
}> {
  try {
    // Check if user already has home/work saved
    const savedPlaces = await UserSavedPlacesRepository.getAllByUser(userId);
    const hasHome = savedPlaces.some((p) => p.label === "home");
    const hasWork = savedPlaces.some((p) => p.label === "work");

    if (hasHome && hasWork) {
      return { suggestedHome: null, suggestedWork: null };
    }

    // Detect patterns
    const patterns =
      await UserLocationHistoryRepository.detectHomeWorkPatterns(userId);

    let suggestedHome: LocationSuggestion | null = null;
    let suggestedWork: LocationSuggestion | null = null;

    if (!hasHome && patterns.likelyHome) {
      const loc = patterns.likelyHome;
      suggestedHome = {
        id: loc.location_id || loc.geohash,
        name: loc.location_name || "Detected home location",
        address: loc.location_address || `${loc.center_lat}, ${loc.center_lon}`,
        latitude: loc.center_lat,
        longitude: loc.center_lon,
        reason: `You visit here often in the evening (${loc.visit_count} times)`,
        confidence: calculateHomeWorkConfidence(loc),
        source: "time_pattern",
      };
    }

    if (!hasWork && patterns.likelyWork) {
      const loc = patterns.likelyWork;
      suggestedWork = {
        id: loc.location_id || loc.geohash,
        name: loc.location_name || "Detected work location",
        address: loc.location_address || `${loc.center_lat}, ${loc.center_lon}`,
        latitude: loc.center_lat,
        longitude: loc.center_lon,
        reason: `You visit here often during work hours (${loc.visit_count} times)`,
        confidence: calculateHomeWorkConfidence(loc),
        source: "time_pattern",
      };
    }

    return { suggestedHome, suggestedWork };
  } catch (error) {
    console.error("Failed to suggest home/work locations:", error);
    return { suggestedHome: null, suggestedWork: null };
  }
}

/**
 * Calculate confidence score for home/work detection
 * Higher visit count = higher confidence
 */
function calculateHomeWorkConfidence(loc: FrequentLocation): number {
  // Base confidence on visit count
  // 5+ visits = 0.7, 10+ = 0.8, 20+ = 0.9
  if (loc.visit_count >= 20) return 0.9;
  if (loc.visit_count >= 10) return 0.8;
  if (loc.visit_count >= 5) return 0.7;
  return 0.6;
}

/**
 * Generate a time-based reason message
 */
function getTimeBasedReason(currentHour: number, typicalHour: number): string {
  const timeDiff = Math.abs(currentHour - typicalHour);
  if (timeDiff <= 2) {
    return "You often visit here at this time";
  }
  return `You typically visit here around ${typicalHour}:00`;
}

/**
 * Calculate distance from location
 */
function calculateDistance(_loc: FrequentLocation): number {
  // This is a placeholder - the actual distance calculation
  // would use the Haversine formula with user's current location
  // For now, return 0 as it will be calculated elsewhere if needed
  return 0;
}
