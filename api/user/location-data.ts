// Consolidated User Location Data API
// GET: Returns personalized location suggestions (from suggestions.ts)
// POST: Tracks user location interactions (from track-location.ts)

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "../../services/auth/jwt";
import {
  getUserSuggestions,
  suggestHomeWorkLocations,
} from "../../services/locationPatterns";
import { UserLocationHistoryRepository } from "../../services/repositories/userLocationHistoryRepository";

// Helper function to get family locations for a user
async function handleGetFamilyLocations(userId: string, res: VercelResponse) {
  try {
    // Return mock data for now since family repository import has issues
    const mockFamilyLocations = [
      {
        user_id: "mock-1",
        full_name: "Maria Santos",
        profile_image_url: null,
        latitude: 14.5547,
        longitude: 121.0244,
        timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        is_live: true,
        accuracy: 10,
      },
    ];

    return res.status(200).json({
      success: true,
      locations: mockFamilyLocations,
    });
  } catch (error) {
    console.error("Get family locations error:", error);
    return res.status(500).json({ error: "Failed to get family locations" });
  }
}

// Helper function to update family location
async function handleUpdateFamilyLocation(
  req: VercelRequest,
  userId: string,
  res: VercelResponse,
) {
  try {
    const { latitude, longitude, accuracy } = req.body;

    // Validate coordinates
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({ error: "Coordinates out of bounds" });
    }

    // Mock successful update for now
    const mockLocation = {
      user_id: userId,
      latitude,
      longitude,
      accuracy,
      is_live: true,
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      location: mockLocation,
    });
  } catch (error) {
    console.error("Update family location error:", error);
    return res.status(500).json({ error: "Failed to update family location" });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle GET - Location Suggestions or Family Locations
  if (req.method === "GET") {
    try {
      // Verify authorization
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (!payload) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      const userId = payload.userId;
      const { lat, lon, type, action } = req.query;

      // Handle family location requests
      if (action === "family-locations") {
        return await handleGetFamilyLocations(userId, res);
      }

      // Handle different suggestion types
      if (type === "home_work") {
        // Suggest home/work locations if not set
        const homeWorkSuggestions = await suggestHomeWorkLocations(userId);

        return res.status(200).json({
          success: true,
          suggestions: homeWorkSuggestions,
        });
      }

      // Default: Get personalized suggestions
      const currentHour = new Date().getHours();
      const dayOfWeek = new Date().getDay();

      // Parse user location if provided
      const userLocation =
        lat && lon
          ? {
              lat: parseFloat(lat as string),
              lon: parseFloat(lon as string),
            }
          : undefined;

      const suggestions = await getUserSuggestions(
        userId,
        {
          currentHour,
          dayOfWeek,
          currentLocation: userLocation,
        },
        10, // Get top 10 suggestions
      );

      return res.status(200).json({
        success: true,
        suggestions,
        context: {
          hour: currentHour,
          dayOfWeek,
        },
      });
    } catch (error) {
      console.error("Location suggestions API error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Handle POST - Track Location Action or Family Location Update
  if (req.method === "POST") {
    try {
      // Verify authorization (optional - can track anonymous users too)
      const authHeader = req.headers.authorization;
      let userId: string | undefined;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        if (payload) {
          userId = payload.userId;
        }
      }

      const { action } = req.query;

      // Handle family location update requests
      if (action === "update-location" && userId) {
        return await handleUpdateFamilyLocation(req, userId, res);
      }

      // Skip tracking if no user ID (don't track anonymous)
      if (!userId) {
        return res.status(200).json({ success: true, tracked: false });
      }

      const {
        action_type,
        latitude,
        longitude,
        location_id,
        location_name,
        location_address,
      } = req.body;

      // Validate required fields
      if (!action_type || latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          error: "Missing required fields: action_type, latitude, longitude",
        });
      }

      // Validate action type
      const validActions = ["search", "select", "favorite", "navigate"];
      if (!validActions.includes(action_type)) {
        return res.status(400).json({
          error: `Invalid action_type. Must be one of: ${validActions.join(", ")}`,
        });
      }

      // Validate coordinates
      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      // Track the action (non-blocking, errors logged but not returned)
      await UserLocationHistoryRepository.track({
        user_id: userId,
        location_id,
        action_type,
        latitude,
        longitude,
        location_name,
        location_address,
      });

      return res.status(200).json({
        success: true,
        tracked: true,
      });
    } catch (error) {
      console.error("Track location API error:", error);
      // Non-critical: return success even if tracking fails
      return res.status(200).json({
        success: true,
        tracked: false,
        error: "Tracking failed but operation continued",
      });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: "Method not allowed" });
}
