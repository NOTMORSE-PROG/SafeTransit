// Forum Type Definitions for SafeTransit
// Types for forum posts, comments, votes, and reports

// ==============================================================================
// Enum Types
// ==============================================================================

export type PostFlair =
  | "general"
  | "routes"
  | "questions"
  | "experiences"
  | "tips_advice";
export type ForumPostStatus = "visible" | "hidden" | "flagged";
export type ReportContentType = "forum_post" | "forum_comment" | "map_tip";
export type ReportReason =
  | "spam"
  | "false_info"
  | "harassment"
  | "inappropriate"
  | "outdated";

// ==============================================================================
// Forum Posts
// ==============================================================================

export interface ForumPost {
  id: string; // UUID
  author_id: string; // UUID
  title: string;
  body: string;
  flair: PostFlair;
  location_tag: string | null;
  photo_urls: string[] | null;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  report_count: number;
  status: ForumPostStatus;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface ForumPostWithAuthor extends ForumPost {
  author_name: string;
  author_image_url: string | null;
  user_vote?: "up" | "down" | null;
}

export interface ForumPostVote {
  post_id: string; // UUID
  user_id: string; // UUID
  vote_type: "up" | "down";
  created_at: string; // ISO timestamp
}

// ==============================================================================
// Forum Comments
// ==============================================================================

export interface ForumComment {
  id: string; // UUID
  post_id: string; // UUID
  author_id: string; // UUID
  parent_id: string | null; // UUID
  content: string;
  likes: number;
  depth: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface ForumCommentWithAuthor extends ForumComment {
  author_name: string;
  author_image_url: string | null;
  user_liked?: boolean;
  replies?: ForumCommentWithAuthor[];
}

export interface ForumCommentLike {
  comment_id: string; // UUID
  user_id: string; // UUID
  created_at: string; // ISO timestamp
}

// ==============================================================================
// Reports
// ==============================================================================

export interface Report {
  id: string; // UUID
  reporter_id: string; // UUID
  content_type: ReportContentType;
  content_id: string; // UUID
  reason: ReportReason;
  additional_info: string | null;
  created_at: string; // ISO timestamp
}

// ==============================================================================
// Helper Types for Inserts
// ==============================================================================

export type ForumPostInsert = Omit<
  ForumPost,
  | "id"
  | "created_at"
  | "updated_at"
  | "upvotes"
  | "downvotes"
  | "comment_count"
  | "report_count"
  | "status"
> & {
  status?: ForumPostStatus;
};

export type ForumCommentInsert = Omit<
  ForumComment,
  "id" | "created_at" | "updated_at" | "likes" | "depth"
>;

export type ReportInsert = Omit<Report, "id" | "created_at">;

// ==============================================================================
// API Request/Response Types
// ==============================================================================

export interface ForumPostsListParams {
  page?: number;
  limit?: number;
  sort?: "recent" | "popular";
  flair?: PostFlair;
  author_id?: string;
}

export interface ForumInteractionRequest {
  action: "vote" | "like" | "report" | "comment" | "reply";
  content_type: "post" | "comment";
  content_id: string;
  // For votes
  vote_type?: "up" | "down";
  // For reports
  reason?: ReportReason;
  additional_info?: string;
  // For comments/replies
  comment_content?: string;
  parent_comment_id?: string;
}

// ==============================================================================
// Flair Config
// ==============================================================================

export const FLAIR_CONFIG: Record<
  PostFlair,
  { emoji: string; label: string; color: string }
> = {
  general: { emoji: "💬", label: "General", color: "neutral" },
  routes: { emoji: "🗺️", label: "Routes", color: "secondary" },
  questions: { emoji: "❓", label: "Questions", color: "info" },
  experiences: { emoji: "📖", label: "Experiences", color: "primary" },
  tips_advice: { emoji: "💡", label: "Tips & Advice", color: "safe" },
};

export const REPORT_REASONS: Record<ReportReason, string> = {
  spam: "Spam",
  false_info: "False Information",
  harassment: "Harassment",
  inappropriate: "Inappropriate Content",
  outdated: "Outdated Information",
};
