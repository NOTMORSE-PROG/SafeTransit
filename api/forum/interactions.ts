// Forum Interactions API Endpoint
// Handles all forum interactions: vote, like, report, comment, reply

import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import {
  ForumPostsRepository,
  ForumCommentsRepository,
  ReportsRepository,
} from "../../services/forumRepository";
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
      return res
        .status(400)
        .json({
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

      case "dislike": {
        if (content_type !== "comment") {
          return res
            .status(400)
            .json({ error: "Dislikes are only available on comments" });
        }

        const result = await ForumCommentsRepository.toggleDislike(
          content_id,
          user.userId,
        );
        return res.status(200).json({
          success: true,
          data: result,
          message: result.disliked ? "Comment disliked" : "Dislike removed",
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
          return res
            .status(400)
            .json({
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
          return res
            .status(400)
            .json({
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
          return res
            .status(400)
            .json({ error: "Maximum reply depth reached" });
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
