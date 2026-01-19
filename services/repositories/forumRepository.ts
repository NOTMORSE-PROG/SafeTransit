// Forum Repository
// Handles all database operations for forum posts, comments, votes, likes, and reports

import { neon } from "@neondatabase/serverless";
import type {
  ForumPost,
  ForumPostWithAuthor,
  ForumComment,
  ForumCommentWithAuthor,
  ForumPostInsert,
  ForumCommentInsert,
  ReportInsert,
  PostFlair,
} from "../types/forum";
import type { QueryResult } from "../types/database";

// Get database URL from environment
const getDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return url;
};

const sql = neon(getDatabaseUrl());

// ==============================================================================
// Forum Posts Repository
// ==============================================================================

export const ForumPostsRepository = {
  /**
   * Get posts with pagination, sorting, and filtering
   */
  async getPosts(params: {
    page?: number;
    limit?: number;
    sort?: "recent" | "popular";
    flair?: PostFlair;
    authorId?: string;
    userId?: string; // For getting user's vote status
  }): Promise<{ posts: ForumPostWithAuthor[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      sort = "recent",
      flair,
      authorId,
      userId,
    } = params;
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions = ["fp.status = 'visible'"];
    if (flair) conditions.push(`fp.flair = '${flair}'`);
    if (authorId) conditions.push(`fp.author_id = '${authorId}'`);
    const whereClause = conditions.join(" AND ");

    // Build ORDER BY
    const orderBy =
      sort === "popular"
        ? "(fp.upvotes - fp.downvotes) DESC, fp.created_at DESC"
        : "fp.created_at DESC";

    const postsQuery = userId
      ? sql`
          SELECT 
            fp.*,
            u.full_name as author_name,
            u.profile_image_url as author_image_url,
            fpv.vote_type as user_vote
          FROM forum_posts fp
          JOIN users u ON fp.author_id = u.id
          LEFT JOIN forum_post_votes fpv ON fp.id = fpv.post_id AND fpv.user_id = ${userId}
          WHERE ${sql.unsafe(whereClause)}
          ORDER BY ${sql.unsafe(orderBy)}
          LIMIT ${limit} OFFSET ${offset}
        `
      : sql`
          SELECT 
            fp.*,
            u.full_name as author_name,
            u.profile_image_url as author_image_url,
            NULL as user_vote
          FROM forum_posts fp
          JOIN users u ON fp.author_id = u.id
          WHERE ${sql.unsafe(whereClause)}
          ORDER BY ${sql.unsafe(orderBy)}
          LIMIT ${limit} OFFSET ${offset}
        `;

    const countQuery = sql`
      SELECT COUNT(*) as count FROM forum_posts fp WHERE ${sql.unsafe(whereClause)}
    `;

    const [posts, countResult] = await Promise.all([postsQuery, countQuery]);
    const total = parseInt(countResult[0]?.count || "0");

    return { posts: posts as ForumPostWithAuthor[], total };
  },

  /**
   * Get single post by ID
   */
  async getById(
    id: string,
    userId?: string,
  ): Promise<ForumPostWithAuthor | null> {
    const result = userId
      ? await sql`
          SELECT 
            fp.*,
            u.full_name as author_name,
            u.profile_image_url as author_image_url,
            fpv.vote_type as user_vote
          FROM forum_posts fp
          JOIN users u ON fp.author_id = u.id
          LEFT JOIN forum_post_votes fpv ON fp.id = fpv.post_id AND fpv.user_id = ${userId}
          WHERE fp.id = ${id}
          LIMIT 1
        `
      : await sql`
          SELECT 
            fp.*,
            u.full_name as author_name,
            u.profile_image_url as author_image_url,
            NULL as user_vote
          FROM forum_posts fp
          JOIN users u ON fp.author_id = u.id
          WHERE fp.id = ${id}
          LIMIT 1
        `;
    return (result[0] as ForumPostWithAuthor) || null;
  },

  /**
   * Create a new post
   */
  async create(data: ForumPostInsert): Promise<ForumPost> {
    const result = await sql`
      INSERT INTO forum_posts (author_id, title, body, flair, location_tag, photo_urls)
      VALUES (${data.author_id}, ${data.title}, ${data.body}, ${data.flair}, ${data.location_tag || null}, ${data.photo_urls || null})
      RETURNING *
    `;
    return result[0] as ForumPost;
  },

  /**
   * Update a post
   */
  async update(
    id: string,
    authorId: string,
    data: Partial<Pick<ForumPost, "title" | "body" | "flair" | "location_tag">>,
  ): Promise<ForumPost | null> {
    // First verify ownership
    const existing =
      await sql`SELECT id FROM forum_posts WHERE id = ${id} AND author_id = ${authorId}`;
    if (existing.length === 0) return null;

    const updates: string[] = [];
    if (data.title !== undefined)
      updates.push(`title = '${data.title.replace(/'/g, "''")}'`);
    if (data.body !== undefined)
      updates.push(`body = '${data.body.replace(/'/g, "''")}'`);
    if (data.flair !== undefined) updates.push(`flair = '${data.flair}'`);
    if (data.location_tag !== undefined)
      updates.push(
        `location_tag = ${data.location_tag ? `'${data.location_tag.replace(/'/g, "''")}'` : "NULL"}`,
      );

    if (updates.length === 0) return this.getById(id);

    const result = await sql`
      UPDATE forum_posts
      SET ${sql.unsafe(updates.join(", "))}
      WHERE id = ${id} AND author_id = ${authorId}
      RETURNING *
    `;
    return (result[0] as ForumPost) || null;
  },

  /**
   * Delete a post
   */
  async delete(id: string, authorId: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM forum_posts WHERE id = ${id} AND author_id = ${authorId}
    `;
    return (result as unknown as QueryResult).count > 0;
  },

  /**
   * Vote on a post (toggle behavior)
   */
  async vote(
    postId: string,
    userId: string,
    voteType: "up" | "down",
  ): Promise<{
    action: "added" | "removed" | "changed";
    newVote: "up" | "down" | null;
  }> {
    const existing = await sql`
      SELECT vote_type FROM forum_post_votes WHERE post_id = ${postId} AND user_id = ${userId}
    `;

    if (existing.length > 0) {
      const oldVote = existing[0].vote_type;

      if (oldVote === voteType) {
        // Same vote - remove it
        await sql`DELETE FROM forum_post_votes WHERE post_id = ${postId} AND user_id = ${userId}`;
        if (voteType === "up") {
          await sql`UPDATE forum_posts SET upvotes = upvotes - 1 WHERE id = ${postId}`;
        } else {
          await sql`UPDATE forum_posts SET downvotes = downvotes - 1 WHERE id = ${postId}`;
        }
        return { action: "removed", newVote: null };
      } else {
        // Different vote - update it
        await sql`UPDATE forum_post_votes SET vote_type = ${voteType} WHERE post_id = ${postId} AND user_id = ${userId}`;
        if (voteType === "up") {
          await sql`UPDATE forum_posts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = ${postId}`;
        } else {
          await sql`UPDATE forum_posts SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = ${postId}`;
        }
        return { action: "changed", newVote: voteType };
      }
    } else {
      // New vote
      await sql`INSERT INTO forum_post_votes (post_id, user_id, vote_type) VALUES (${postId}, ${userId}, ${voteType})`;
      if (voteType === "up") {
        await sql`UPDATE forum_posts SET upvotes = upvotes + 1 WHERE id = ${postId}`;
      } else {
        await sql`UPDATE forum_posts SET downvotes = downvotes + 1 WHERE id = ${postId}`;
      }
      return { action: "added", newVote: voteType };
    }
  },
};

// ==============================================================================
// Forum Comments Repository
// ==============================================================================

export const ForumCommentsRepository = {
  /**
   * Get comments for a post with nested replies
   */
  async getByPostId(
    postId: string,
    userId?: string,
    sort: "popular" | "newest" | "oldest" = "newest",
  ): Promise<ForumCommentWithAuthor[]> {
    const orderBy =
      sort === "popular"
        ? "fc.likes DESC, fc.created_at DESC"
        : sort === "oldest"
          ? "fc.created_at ASC"
          : "fc.created_at DESC";

    const comments = userId
      ? await sql`
          SELECT 
            fc.*,
            u.full_name as author_name,
            u.profile_image_url as author_image_url,
            CASE WHEN fcl.user_id IS NOT NULL THEN true ELSE false END as user_liked
          FROM forum_comments fc
          JOIN users u ON fc.author_id = u.id
          LEFT JOIN forum_comment_likes fcl ON fc.id = fcl.comment_id AND fcl.user_id = ${userId}
          WHERE fc.post_id = ${postId}
          ORDER BY ${sql.unsafe(orderBy)}
        `
      : await sql`
          SELECT 
            fc.*,
            u.full_name as author_name,
            u.profile_image_url as author_image_url,
            false as user_liked
          FROM forum_comments fc
          JOIN users u ON fc.author_id = u.id
          WHERE fc.post_id = ${postId}
          ORDER BY ${sql.unsafe(orderBy)}
        `;

    // Organize into nested structure
    const commentsMap = new Map<string, ForumCommentWithAuthor>();
    const topLevel: ForumCommentWithAuthor[] = [];

    for (const comment of comments as ForumCommentWithAuthor[]) {
      comment.replies = [];
      commentsMap.set(comment.id, comment);
    }

    for (const comment of comments as ForumCommentWithAuthor[]) {
      if (comment.parent_id && commentsMap.has(comment.parent_id)) {
        commentsMap.get(comment.parent_id)!.replies!.push(comment);
      } else if (!comment.parent_id) {
        topLevel.push(comment);
      }
    }

    return topLevel;
  },

  /**
   * Create a comment
   */
  async create(data: ForumCommentInsert): Promise<ForumComment> {
    // If this is a reply, get the parent's depth
    let depth = 0;
    if (data.parent_id) {
      const parent =
        await sql`SELECT depth FROM forum_comments WHERE id = ${data.parent_id}`;
      if (parent.length > 0) {
        depth = parent[0].depth + 1;
        if (depth > 1) {
          throw new Error("Maximum reply depth exceeded (2 levels)");
        }
      }
    }

    const result = await sql`
      INSERT INTO forum_comments (post_id, author_id, parent_id, content, depth)
      VALUES (${data.post_id}, ${data.author_id}, ${data.parent_id || null}, ${data.content}, ${depth})
      RETURNING *
    `;
    return result[0] as ForumComment;
  },

  /**
   * Like/unlike a comment (toggle)
   */
  async toggleLike(
    commentId: string,
    userId: string,
  ): Promise<{ liked: boolean }> {
    const existing = await sql`
      SELECT 1 FROM forum_comment_likes WHERE comment_id = ${commentId} AND user_id = ${userId}
    `;

    if (existing.length > 0) {
      await sql`DELETE FROM forum_comment_likes WHERE comment_id = ${commentId} AND user_id = ${userId}`;
      await sql`UPDATE forum_comments SET likes = likes - 1 WHERE id = ${commentId}`;
      return { liked: false };
    } else {
      await sql`INSERT INTO forum_comment_likes (comment_id, user_id) VALUES (${commentId}, ${userId})`;
      await sql`UPDATE forum_comments SET likes = likes + 1 WHERE id = ${commentId}`;
      return { liked: true };
    }
  },

  /**
   * Delete a comment
   */
  async delete(id: string, authorId: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM forum_comments WHERE id = ${id} AND author_id = ${authorId}
    `;
    return (result as unknown as QueryResult).count > 0;
  },
};

// ==============================================================================
// Reports Repository
// ==============================================================================

export const ReportsRepository = {
  /**
   * Create a report (prevents duplicates)
   */
  async create(
    data: ReportInsert,
  ): Promise<{ success: boolean; alreadyReported: boolean }> {
    try {
      await sql`
        INSERT INTO reports (reporter_id, content_type, content_id, reason, additional_info)
        VALUES (${data.reporter_id}, ${data.content_type}, ${data.content_id}, ${data.reason}, ${data.additional_info || null})
      `;
      return { success: true, alreadyReported: false };
    } catch (error: unknown) {
      // Check for unique constraint violation
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "23505"
      ) {
        return { success: false, alreadyReported: true };
      }
      throw error;
    }
  },

  /**
   * Check if user already reported content
   */
  async hasReported(
    reporterId: string,
    contentType: string,
    contentId: string,
  ): Promise<boolean> {
    const result = await sql`
      SELECT 1 FROM reports 
      WHERE reporter_id = ${reporterId} AND content_type = ${contentType} AND content_id = ${contentId}
    `;
    return result.length > 0;
  },
};

// Re-export QueryResult type for use in other files
export type { QueryResult } from "../types/database";
