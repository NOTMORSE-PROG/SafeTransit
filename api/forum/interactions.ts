// Forum Interactions API Endpoint
// Handles all forum interactions: vote, like, report, comment, reply

import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import {
  ForumPostsRepository,
  ForumCommentsRepository,
  ReportsRepository,
} from "../../services/forumRepository";
import { TipsRepository } from "../../services/repositories/tipsRepository";
import type {
  ForumInteractionRequest,
  ReportReason,
  ReportContentType,
} from "../../services/types/forum";

interface JwtPayload {
  userId: string;
  email: string;
}

// Helper to require authentication
function requireAuth(req: VercelRequest): JwtPayload {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "",
    ) as JwtPayload;
    return decoded;
  } catch {
    throw new Error("Unauthorized");
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = requireAuth(req);
    const body = req.body as ForumInteractionRequest;
    const { action, content_type, content_id } = body;

    if (!action || !content_type || !content_id) {
      return res.status(400).json({
        error: "Missing required fields: action, content_type, content_id",
      });
    }

    // Handle different actions
    switch (action) {
      case "vote": {
        if (content_type !== "post") {
          return res
            .status(400)
            .json({ error: "Voting is only available on posts" });
        }
        if (!body.vote_type || !["up", "down"].includes(body.vote_type)) {
          return res
            .status(400)
            .json({ error: 'vote_type must be "up" or "down"' });
        }

        const result = await ForumPostsRepository.vote(
          content_id,
          user.userId,
          body.vote_type,
        );
        return res.status(200).json({
          success: true,
          data: result,
          message:
            result.action === "removed"
              ? "Vote removed"
              : `Vote ${result.action}`,
        });
      }

      case "like": {
        if (content_type !== "comment") {
          return res
            .status(400)
            .json({ error: "Likes are only available on comments" });
        }

        const result = await ForumCommentsRepository.toggleLike(
          content_id,
          user.userId,
        );
        return res.status(200).json({
          success: true,
          data: result,
          message: result.liked ? "Comment liked" : "Like removed",
        });
      }

      case "report": {
        if (
          !body.reason ||
          ![
            "spam",
            "false_info",
            "harassment",
            "inappropriate",
            "outdated",
          ].includes(body.reason)
        ) {
          return res.status(400).json({ error: "Valid reason is required" });
        }

        const reportContentType: ReportContentType =
          content_type === "post" ? "forum_post" : "forum_comment";
        const result = await ReportsRepository.create({
          reporter_id: user.userId,
          content_type: reportContentType,
          content_id,
          reason: body.reason as ReportReason,
          additional_info: body.additional_info || null,
        });

        if (result.alreadyReported) {
          return res.status(400).json({
            success: false,
            error: "You have already reported this content",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Report submitted successfully",
        });
      }

      case "comment": {
        if (content_type !== "post") {
          return res
            .status(400)
            .json({ error: "Comments can only be added to posts" });
        }
        if (!body.comment_content || body.comment_content.length > 300) {
          return res.status(400).json({
            error: "Comment is required and must be max 300 characters",
          });
        }

        const comment = await ForumCommentsRepository.create({
          post_id: content_id,
          author_id: user.userId,
          parent_id: null,
          content: body.comment_content.trim(),
        });

        return res.status(201).json({
          success: true,
          data: comment,
          message: "Comment added successfully",
        });
      }

      case "reply": {
        if (content_type !== "comment") {
          return res
            .status(400)
            .json({ error: "Replies can only be added to comments" });
        }
        if (!body.comment_content || body.comment_content.length > 300) {
          return res.status(400).json({
            error: "Reply is required and must be max 300 characters",
          });
        }
        if (!body.parent_comment_id) {
          return res
            .status(400)
            .json({ error: "parent_comment_id is required for replies" });
        }

        // We need to get the parent comment's post_id
        // For simplicity, we'll use a direct query here
        const { neon } = await import("@neondatabase/serverless");
        const sql = neon(process.env.DATABASE_URL || "");
        const parentComment = await sql`
          SELECT post_id, depth FROM forum_comments WHERE id = ${content_id}
        `;

        if (parentComment.length === 0) {
          return res.status(404).json({ error: "Parent comment not found" });
        }

        if (parentComment[0].depth >= 999) {
          return res.status(400).json({ error: "Maximum reply depth reached" });
        }

        const reply = await ForumCommentsRepository.create({
          post_id: parentComment[0].post_id,
          author_id: user.userId,
          parent_id: content_id,
          content: body.comment_content.trim(),
        });

        return res.status(201).json({
          success: true,
          data: reply,
          message: "Reply added successfully",
        });
      }

      case "submit_tip": {
        if (content_type !== "map_tip") {
          return res.status(400).json({ error: "Invalid content_type for submit_tip" });
        }

        const { tip_data } = body;
        if (!tip_data) {
          return res.status(400).json({ error: "tip_data is required" });
        }

        // Validate required fields
        if (!tip_data.title || tip_data.title.length > 500) {
          return res.status(400).json({ error: "title is required and must be max 500 characters" });
        }
        if (!tip_data.message || tip_data.message.length > 2000) {
          return res.status(400).json({ error: "message is required and must be max 2000 characters" });
        }
        if (!tip_data.category || !["lighting", "safety", "transit", "harassment", "safe_haven", "construction"].includes(tip_data.category)) {
          return res.status(400).json({ error: "Valid category is required" });
        }
        if (tip_data.latitude === undefined || tip_data.longitude === undefined) {
          return res.status(400).json({ error: "latitude and longitude are required" });
        }
        if (!tip_data.location_name) {
          return res.status(400).json({ error: "location_name is required" });
        }

        // Create tip (auto-approved)
        const tip = await TipsRepository.createTip({
          author_id: user.userId,
          title: tip_data.title.trim(),
          message: tip_data.message.trim(),
          category: tip_data.category,
          latitude: tip_data.latitude,
          longitude: tip_data.longitude,
          location_name: tip_data.location_name.trim(),
          time_relevance: tip_data.time_relevance || "24/7",
          is_temporary: tip_data.is_temporary || false,
          expires_at: tip_data.expires_at || null,
          status: "approved", // Auto-approve
          photo_url: tip_data.photo_url || null,
        });

        // TODO: Trigger real-time heatmap update
        // await updateHeatmapForTip(tip.id);

        return res.status(201).json({
          success: true,
          tip_id: tip.id,
          status: "approved",
          message: "Tip submitted and approved successfully",
        });
      }

      case "follow_location": {
        if (content_type !== "location") {
          return res.status(400).json({ error: "Invalid content_type for follow_location" });
        }

        const { location_data } = body;
        if (!location_data) {
          return res.status(400).json({ error: "location_data is required" });
        }

        if (location_data.latitude === undefined || location_data.longitude === undefined) {
          return res.status(400).json({ error: "latitude and longitude are required" });
        }
        if (!location_data.location_name) {
          return res.status(400).json({ error: "location_name is required" });
        }
        if (!location_data.radius_meters || ![500, 1000, 5000].includes(location_data.radius_meters)) {
          return res.status(400).json({ error: "radius_meters must be 500, 1000, or 5000" });
        }

        // Create followed location
        const { neon } = await import("@neondatabase/serverless");
        const sql = neon(process.env.DATABASE_URL || "");

        const result = await sql`
          INSERT INTO followed_locations (user_id, latitude, longitude, radius_meters, location_name)
          VALUES (${user.userId}, ${location_data.latitude}, ${location_data.longitude}, ${location_data.radius_meters}, ${location_data.location_name})
          ON CONFLICT (user_id, latitude, longitude) DO UPDATE
          SET radius_meters = ${location_data.radius_meters}, location_name = ${location_data.location_name}
          RETURNING *
        `;

        return res.status(201).json({
          success: true,
          followed_location: result[0],
          message: "Location followed successfully",
        });
      }

      case "analyze_route": {
        if (content_type !== "route") {
          return res.status(400).json({ error: "Invalid content_type for analyze_route" });
        }

        const { route_coordinates } = body;
        if (!route_coordinates || !Array.isArray(route_coordinates) || route_coordinates.length === 0) {
          return res.status(400).json({ error: "route_coordinates array is required" });
        }

        // Calculate route bounds
        const lats = route_coordinates.map(([lat]: number[]) => lat);
        const lons = route_coordinates.map(([, lon]: number[]) => lon);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);

        // Fetch tips along route
        const tips = await TipsRepository.getTips({
          bounds: { minLat, maxLat, minLon, maxLon },
          status: "approved",
        });

        // TODO: Implement full route safety scoring algorithm
        // For now, return basic data
        return res.status(200).json({
          success: true,
          tips_along_route: tips.length,
          tips,
          message: "Route analyzed successfully (basic implementation)",
        });
      }

      default:
        return res.status(400).json({ error: "Invalid action" });
    }
  } catch (error) {
    console.error("Forum interactions error:", error);
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (error.message.includes("Maximum reply depth")) {
        return res.status(400).json({ error: error.message });
      }
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}
