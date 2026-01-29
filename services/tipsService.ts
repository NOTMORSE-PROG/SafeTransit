import AsyncStorage from "@react-native-async-storage/async-storage";
import { categoryColors, colors } from "@/constants/theme";
import { getApiUrl } from "@/utils/api";

export type TipCategory =
  | "lighting"
  | "harassment"
  | "transit"
  | "safe_haven"
  | "construction";
export type TimeRelevance =
  | "morning"
  | "afternoon"
  | "evening"
  | "night"
  | "24/7";
export type TipStatus = "pending" | "approved" | "rejected" | "expired";

// Error types for better error handling
export class TipsServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "TipsServiceError";
  }
}

export class NetworkError extends TipsServiceError {
  constructor(
    message: string = "Network error. Please check your connection.",
  ) {
    super(message, "NETWORK_ERROR");
  }
}

export class AuthenticationError extends TipsServiceError {
  constructor(
    message: string = "Authentication failed. Please sign in again.",
  ) {
    super(message, "AUTH_ERROR", 401);
  }
}

export class ValidationError extends TipsServiceError {
  constructor(message: string = "Invalid data provided.") {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export interface Tip {
  id: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  title: string;
  message: string;
  category: TipCategory;
  latitude: number;
  longitude: number;
  location_name: string;
  time_relevance: TimeRelevance;
  is_temporary: boolean;
  expires_at?: string;
  status: TipStatus;
  photo_url?: string;
  created_at: string;
  updated_at: string;
  // NEW: Enhanced metadata for better UX
  severity: 'low' | 'medium' | 'high' | 'critical';
  verified: boolean;
  verification_source?: 'community' | 'authority' | 'ai';
  helpful_count: number;
  view_count: number;
  is_trending: boolean;
  status_lifecycle: 'active' | 'resolved' | 'outdated';
  last_confirmed_at?: string;
  confirmed_by_count: number;
}

export interface FetchTipsParams {
  lat?: number;
  lon?: number;
  radius?: number; // 500, 1000, 5000 meters
  category?: TipCategory;
  time?: TimeRelevance;
  bounds?: string; // "minLat,minLon,maxLat,maxLon"
}

export interface SubmitTipData {
  title: string;
  message: string;
  category: TipCategory;
  latitude: number;
  longitude: number;
  location_name: string;
  time_relevance: TimeRelevance;
  photo_url?: string;
  is_temporary?: boolean;
  expires_at?: string;
}

// Get API URL using the centralized utility function
const getApiBaseUrl = () => getApiUrl();

/**
 * Safely parse coordinate values with validation
 * Prevents NaN crashes by validating numeric values and ranges
 * @param value - The value to parse (string or number)
 * @param fallback - Fallback value if parsing fails (default: 0)
 * @returns Valid coordinate number or fallback
 */
export function safeParseCoordinate(value: unknown, fallback: number = 0): number {
  // If already a valid number, return it
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value;
  }

  // If string, try to parse
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }

  // Invalid coordinate detected - log warning and return fallback
  console.warn('[Coordinate Validation] Invalid coordinate detected:', value, '- using fallback:', fallback);
  return fallback;
}

/**
 * Validate coordinate is within valid lat/lon ranges
 * @param lat - Latitude (-90 to 90)
 * @param lon - Longitude (-180 to 180)
 * @returns true if valid, false otherwise
 */
export function isValidCoordinate(lat: number, lon: number): boolean {
  return (
    !isNaN(lat) && !isNaN(lon) &&
    isFinite(lat) && isFinite(lon) &&
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180
  );
}

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEY_PREFIX = "tips_cache_";

interface CachedData {
  tips: Tip[];
  timestamp: number;
}

/**
 * Generate cache key from fetch parameters
 */
function generateCacheKey(params: FetchTipsParams): string {
  const parts = [
    params.lat?.toFixed(4) || "no-lat",
    params.lon?.toFixed(4) || "no-lon",
    params.radius || "no-radius",
    params.category || "all-categories",
    params.time || "all-times",
    params.bounds || "no-bounds",
  ];
  return `${CACHE_KEY_PREFIX}${parts.join("_")}`;
}

/**
 * Read tips from cache
 */
async function readFromCache(cacheKey: string): Promise<Tip[] | null> {
  try {
    const cachedDataStr = await AsyncStorage.getItem(cacheKey);
    if (!cachedDataStr) return null;

    const cachedData: CachedData = JSON.parse(cachedDataStr);
    const now = Date.now();

    // Check if cache is still valid
    if (now - cachedData.timestamp > CACHE_TTL) {
      // Cache expired, remove it
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    return cachedData.tips;
  } catch (error) {
    console.error("Error reading from cache:", error);
    return null;
  }
}

/**
 * Write tips to cache
 */
async function writeToCache(cacheKey: string, tips: Tip[]): Promise<void> {
  try {
    const cachedData: CachedData = {
      tips,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedData));
  } catch (error) {
    console.error("Error writing to cache:", error);
  }
}

const MAX_CACHE_ENTRIES = 50; // Limit to 50 cached regions

/**
 * Clean up expired cache entries and enforce size limits
 * Should be called periodically (e.g., every 5 minutes)
 */
export async function cleanupExpiredCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));

    if (cacheKeys.length === 0) return;

    const now = Date.now();
    const keysToRemove: string[] = [];
    const validEntries: { key: string; timestamp: number }[] = [];

    // Check each cache entry
    for (const key of cacheKeys) {
      const cachedDataStr = await AsyncStorage.getItem(key);
      if (cachedDataStr) {
        try {
          const cachedData: CachedData = JSON.parse(cachedDataStr);

          // Remove expired entries
          if (now - cachedData.timestamp > CACHE_TTL) {
            keysToRemove.push(key);
          } else {
            validEntries.push({ key, timestamp: cachedData.timestamp });
          }
        } catch {
          // Remove corrupted entries
          keysToRemove.push(key);
        }
      }
    }

    // Enforce max entries (LRU eviction)
    if (validEntries.length > MAX_CACHE_ENTRIES) {
      // Sort by timestamp (oldest first)
      validEntries.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest entries
      const excess = validEntries.length - MAX_CACHE_ENTRIES;
      keysToRemove.push(...validEntries.slice(0, excess).map(e => e.key));
    }

    // Remove all marked keys
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`[Cache] Cleaned up ${keysToRemove.length} tips cache entries`);
    }
  } catch (error) {
    console.error("Error cleaning up cache:", error);
  }
}

/**
 * Clear all tips caches (useful for debugging or force refresh)
 */
export async function clearAllTipsCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));

    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`[Cache] Cleared all ${cacheKeys.length} tips cache entries`);
    }
  } catch (error) {
    console.error("Error clearing tips cache:", error);
  }
}

/**
 * Clear all tips cache
 */
export async function clearTipsCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}

/**
 * Fetch approved tips from the API (with caching and improved error handling)
 */
export async function fetchTips(params: FetchTipsParams): Promise<Tip[]> {
  try {
    // Generate cache key
    const cacheKey = generateCacheKey(params);

    // Try to read from cache first
    const cachedTips = await readFromCache(cacheKey);
    if (cachedTips !== null) {
      return cachedTips;
    }

    // Cache miss - fetch from API
    const token = await AsyncStorage.getItem("auth_token");

    // Note: Authentication is optional for tips endpoint

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append("mode", "tips");

    if (params.lat !== undefined)
      queryParams.append("lat", params.lat.toString());
    if (params.lon !== undefined)
      queryParams.append("lon", params.lon.toString());
    if (params.radius) queryParams.append("radius", params.radius.toString());
    if (params.category) queryParams.append("category", params.category);
    if (params.time) queryParams.append("time", params.time);
    if (params.bounds) queryParams.append("bounds", params.bounds);

    const url = `${getApiBaseUrl()}/api/locations/search?${queryParams.toString()}`;
    const apiBaseUrl = getApiBaseUrl();

    if (!apiBaseUrl || apiBaseUrl.trim() === "") {
      throw new NetworkError(
        "API URL not configured. Please check your environment configuration.",
      );
    }

    let response;
    try {
      // Use a simpler fetch without AbortSignal.timeout for Android compatibility
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Prepare headers - include auth token if available, but don't require it
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      response = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(
        "[fetchTips] Response status:",
        response.status,
        response.statusText,
      );
    } catch (fetchError: unknown) {
      console.error("[fetchTips] Fetch error details:", fetchError);
      const err = fetchError as { name?: string; message?: string };
      if (err.name === "AbortError") {
        throw new NetworkError("Request timed out. Please try again.");
      }
      // Check for network-specific errors
      if (
        err.message?.includes("Network request failed") ||
        err.message?.includes("Failed to fetch")
      ) {
        throw new NetworkError(`Network connection failed: ${err.message}`);
      }
      throw new NetworkError(
        `Network request failed: ${err.message || "Unknown error"}`,
      );
    }

    if (!response.ok) {
      console.error(
        "[fetchTips] HTTP error:",
        response.status,
        response.statusText,
      );
      if (response.status === 401) {
        throw new AuthenticationError();
      } else if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        throw new ValidationError(
          errorData.error || "Invalid request parameters",
        );
      } else if (response.status >= 500) {
        throw new TipsServiceError(
          "Server error. Please try again later.",
          "SERVER_ERROR",
          response.status,
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new TipsServiceError(
          errorData.error || "Failed to fetch tips",
          "UNKNOWN_ERROR",
          response.status,
        );
      }
    }

    const data = await response.json();
    const tips = (data.tips || []).map((tip: Record<string, unknown>) => ({
      ...tip,
      latitude: safeParseCoordinate(tip.latitude, 0),
      longitude: safeParseCoordinate(tip.longitude, 0),
      // Ensure enhanced metadata has defaults if missing
      severity: tip.severity || 'medium',
      verified: tip.verified || false,
      helpful_count: tip.helpful_count || 0,
      view_count: tip.view_count || 0,
      is_trending: tip.is_trending || false,
      status_lifecycle: tip.status_lifecycle || 'active',
      confirmed_by_count: tip.confirmed_by_count || 0,
    }));

    // Write to cache for future requests
    await writeToCache(cacheKey, tips);

    return tips;
  } catch (error) {
    // Re-throw known errors
    if (error instanceof TipsServiceError) {
      console.error("Tips service error:", error.message, error.code);
      throw error;
    }

    // Wrap unknown errors
    console.error("Unexpected error fetching tips:", error);
    throw new TipsServiceError("An unexpected error occurred", "UNKNOWN_ERROR");
  }
}

/**
 * Submit a new tip (auto-approved with improved error handling)
 */
export async function submitTip(
  tipData: SubmitTipData,
): Promise<{ success: boolean; tip_id: string; status: string }> {
  try {
    const token = await AsyncStorage.getItem("auth_token");
    if (!token) {
      throw new AuthenticationError();
    }

    let response;
    try {
      response = await fetch(`${getApiBaseUrl()}/api/forum/interactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "submit_tip",
          content_type: "map_tip",
          tip_data: tipData,
        }),
        signal: AbortSignal.timeout(15000), // 15 second timeout for submission
      });
    } catch (fetchError: unknown) {
      const err = fetchError as { name?: string };
      if (err.name === "AbortError") {
        throw new NetworkError("Submission timed out. Please try again.");
      }
      throw new NetworkError();
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new AuthenticationError();
      } else if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        throw new ValidationError(errorData.error || "Invalid tip data");
      } else if (response.status >= 500) {
        throw new TipsServiceError(
          "Server error. Please try again later.",
          "SERVER_ERROR",
          response.status,
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new TipsServiceError(
          errorData.error || "Failed to submit tip",
          "UNKNOWN_ERROR",
          response.status,
        );
      }
    }

    const data = await response.json();

    // Clear cache since new tip was added
    await clearTipsCache();

    return data;
  } catch (error) {
    // Re-throw known errors
    if (error instanceof TipsServiceError) {
      console.error("Tips service error:", error.message, error.code);
      throw error;
    }

    // Wrap unknown errors
    console.error("Unexpected error submitting tip:", error);
    throw new TipsServiceError(
      "An unexpected error occurred while submitting",
      "UNKNOWN_ERROR",
    );
  }
}

/**
 * Get current user's submitted tips
 */
export async function getMyTips(): Promise<Tip[]> {
  try {
    const token = await AsyncStorage.getItem("auth_token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${getApiBaseUrl()}/api/user/profile?mode=my_tips`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch user tips");
    }

    const data = await response.json();
    const tips = (data.tips || []).map((tip: Record<string, unknown>) => ({
      ...tip,
      latitude: safeParseCoordinate(tip.latitude, 0),
      longitude: safeParseCoordinate(tip.longitude, 0),
      // Ensure enhanced metadata has defaults if missing
      severity: tip.severity || 'medium',
      verified: tip.verified || false,
      helpful_count: tip.helpful_count || 0,
      view_count: tip.view_count || 0,
      is_trending: tip.is_trending || false,
      status_lifecycle: tip.status_lifecycle || 'active',
      confirmed_by_count: tip.confirmed_by_count || 0,
    }));
    return tips;
  } catch (error) {
    console.error("Error fetching user tips:", error);
    throw error;
  }
}

/**
 * Get category icon name for lucide-react-native
 */
export function getCategoryIcon(category: TipCategory): string {
  switch (category) {
    case "lighting":
      return "Lightbulb";
    case "harassment":
      return "AlertTriangle";
    case "transit":
      return "Bus";
    case "safe_haven":
      return "Shield";
    case "construction":
      return "Construction";
    default:
      return "MapPin";
  }
}

/**
 * Get category color (uses theme colors)
 */
export function getCategoryColor(category: TipCategory): string {
  return categoryColors[category] || colors.neutral[500];
}

/**
 * Get time relevance emoji
 */
export function getTimeRelevanceEmoji(time: TimeRelevance): string {
  switch (time) {
    case "morning":
      return "🌅";
    case "afternoon":
      return "☀️";
    case "evening":
      return "🌆";
    case "night":
      return "🌙";
    case "24/7":
      return "⏰";
    default:
      return "⏰";
  }
}
