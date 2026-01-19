// Forum Type Definitions for SafeTransit Backend
// Matches the PostgreSQL schema created by migrations

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
  photo_url: string | null;
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
  dislikes: number;
  depth: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface ForumCommentWithAuthor extends ForumComment {
  author_name: string;
  author_image_url: string | null;
  user_liked?: boolean;
  user_disliked?: boolean;
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
// Insert Types
// ==============================================================================

export type ForumPostInsert = Pick<
  ForumPost,
  "author_id" | "title" | "body" | "flair"
> & {
  location_tag?: string | null;
  photo_url?: string | null;
};

export type ForumCommentInsert = Pick<
  ForumComment,
  "post_id" | "author_id" | "content"
> & {
  parent_id?: string | null;
};

export type ReportInsert = Pick<
  Report,
  "reporter_id" | "content_type" | "content_id" | "reason"
> & {
  additional_info?: string | null;
};

// ==============================================================================
// Report Reasons Config
// ==============================================================================

export const REPORT_REASONS: Record<ReportReason, string> = {
  spam: "Spam or misleading",
  false_info: "False information",
  harassment: "Harassment or bullying",
  inappropriate: "Inappropriate content",
  outdated: "Outdated information",
};

// ==============================================================================
// API Request Types
// ==============================================================================

export interface ForumInteractionRequest {
  action: "vote" | "like" | "dislike" | "report" | "comment" | "reply";
  content_type: "post" | "comment";
  content_id: string;
  vote_type?: "up" | "down";
  reason?: string;
  additional_info?: string;
  comment_content?: string;
  parent_comment_id?: string;
}
