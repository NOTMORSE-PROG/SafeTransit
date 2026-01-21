// Forum Service
// Client-side API wrapper for forum endpoints

import { apiFetch } from "@/utils/api";
import type {
  ForumPostWithAuthor,
  ForumCommentWithAuthor,
  PostFlair,
  ReportReason,
} from "./types/forum";

// Re-export types for convenience
export * from "./types/forum";

// ==============================================================================
// Types
// ==============================================================================

export interface ForumPostsResponse {
  success: boolean;
  data: ForumPostWithAuthor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ForumPostDetailResponse {
  success: boolean;
  data: ForumPostWithAuthor & {
    comments: ForumCommentWithAuthor[];
  };
}

export interface CreatePostData {
  title: string;
  body: string;
  flair: PostFlair;
  location_tag?: string;
  photo_urls?: string[];
}

export interface InteractionResult {
  success: boolean;
  data?: {
    action?: "added" | "removed" | "changed";
    newVote?: "up" | "down" | null;
    liked?: boolean;
  };
  message?: string;
  error?: string;
}

// ==============================================================================
// API Functions
// ==============================================================================

/**
 * Get list of forum posts
 */
export async function getPosts(params: {
  page?: number;
  limit?: number;
  sort?: "recent" | "popular";
  flair?: PostFlair;
  authorId?: string;
  token?: string;
}): Promise<ForumPostsResponse> {
  const {
    page = 1,
    limit = 20,
    sort = "recent",
    flair,
    authorId,
    token,
  } = params;

  const queryParams = new URLSearchParams();
  queryParams.append("page", String(page));
  queryParams.append("limit", String(limit));
  queryParams.append("sort", sort);
  if (flair) queryParams.append("flair", flair);
  if (authorId) queryParams.append("author_id", authorId);

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await apiFetch(
    `/api/forum/posts?${queryParams.toString()}`,
    { headers },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch posts");
  }

  return data;
}

/**
 * Get single post with comments
 */
export async function getPost(
  postId: string,
  options?: { token?: string; commentSort?: "popular" | "newest" | "oldest" },
): Promise<ForumPostDetailResponse> {
  const { token, commentSort = "newest" } = options || {};

  const queryParams = new URLSearchParams();
  queryParams.append("comment_sort", commentSort);

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await apiFetch(
    `/api/forum/posts/${postId}?${queryParams.toString()}`,
    { headers },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch post");
  }

  return data;
}

/**
 * Create a new post
 */
export async function createPost(
  postData: CreatePostData,
  token: string,
): Promise<ForumPostWithAuthor> {
  const response = await apiFetch("/api/forum/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(postData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create post");
  }

  return data.data;
}

/**
 * Update a post
 */
export async function updatePost(
  postId: string,
  updates: Partial<CreatePostData>,
  token: string,
): Promise<ForumPostWithAuthor> {
  const response = await apiFetch(`/api/forum/posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to update post");
  }

  return data.data;
}

/**
 * Delete a post
 */
export async function deletePost(postId: string, token: string): Promise<void> {
  const response = await apiFetch(`/api/forum/posts/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to delete post");
  }
}

/**
 * Vote on a post
 */
export async function votePost(
  postId: string,
  voteType: "up" | "down",
  token: string,
): Promise<InteractionResult> {
  const response = await apiFetch("/api/forum/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: "vote",
      content_type: "post",
      content_id: postId,
      vote_type: voteType,
    }),
  });

  return response.json();
}

/**
 * Like/unlike a comment
 */
export async function likeComment(
  commentId: string,
  token: string,
): Promise<InteractionResult> {
  const response = await apiFetch("/api/forum/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: "like",
      content_type: "comment",
      content_id: commentId,
    }),
  });

  return response.json();
}

/**
 * Report content
 */
export async function reportContent(
  contentType: "post" | "comment",
  contentId: string,
  reason: ReportReason,
  token: string,
  additionalInfo?: string,
): Promise<InteractionResult> {
  const response = await apiFetch("/api/forum/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: "report",
      content_type: contentType,
      content_id: contentId,
      reason,
      additional_info: additionalInfo,
    }),
  });

  return response.json();
}

/**
 * Add a comment to a post
 */
export async function addComment(
  postId: string,
  content: string,
  token: string,
): Promise<InteractionResult> {
  const response = await apiFetch("/api/forum/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: "comment",
      content_type: "post",
      content_id: postId,
      comment_content: content,
    }),
  });

  return response.json();
}

/**
 * Reply to a comment (supports nested replies)
 */
export async function replyToComment(
  commentId: string,
  content: string,
  token: string,
): Promise<InteractionResult> {
  const response = await apiFetch("/api/forum/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: "reply",
      content_type: "comment",
      content_id: commentId,
      parent_comment_id: commentId,
      comment_content: content,
    }),
  });

  return response.json();
}
