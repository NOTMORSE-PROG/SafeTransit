// Post Detail Screen
// Full post view with comments, voting, and reporting

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  MapPin,
  Flag,
  Send,
  Clock,
  TrendingUp,
  ArrowDown,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { VoteButtons } from "@/components/forum/VoteButtons";
import { FlairBadge } from "@/components/forum/FlairBadge";
import { CommentItem } from "@/components/forum/CommentItem";
import { ReportModal } from "@/components/forum/ReportModal";
import { ImageZoomModal } from "@/components/ImageZoomModal";
import {
  getPost,
  votePost,
  addComment,
  likeComment,
  replyToComment,
  reportContent,
  deletePost,
  type ForumPostWithAuthor,
  type ForumCommentWithAuthor,
  type ReportReason,
} from "@/services/forumService";

type CommentSort = "popular" | "newest" | "oldest";

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;
  return "Just now";
}

export default function PostDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();

  const [post, setPost] = useState<ForumPostWithAuthor | null>(null);
  const [comments, setComments] = useState<ForumCommentWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [commentSort, setCommentSort] = useState<CommentSort>("newest");
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{id: string; name: string} | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Refs for auto-scroll functionality
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  const commentRefs = useRef<Map<string, View>>(new Map());

  const loadPost = useCallback(
    async (showRefresh = false) => {
      if (!id) return;

      try {
        if (showRefresh) setIsRefreshing(true);
        else setIsLoading(true);
        setError(null);

        const response = await getPost(id, {
          token: token || undefined,
          commentSort,
        });
        setPost(response.data);
        setComments(response.data.comments);
      } catch (err) {
        console.error("Failed to load post:", err);
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [id, token, commentSort],
  );

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleVote = async (voteType: "up" | "down") => {
    if (!token || !post) {
      router.push("/auth/login");
      return;
    }

    setIsVoting(true);
    try {
      const result = await votePost(post.id, voteType, token);
      if (result.success) {
        const wasUpvoted = post.user_vote === "up";
        const wasDownvoted = post.user_vote === "down";
        const newVote = result.data?.newVote;

        let upvotes = post.upvotes;
        let downvotes = post.downvotes;

        if (wasUpvoted) upvotes--;
        if (wasDownvoted) downvotes--;
        if (newVote === "up") upvotes++;
        if (newVote === "down") downvotes++;

        setPost({ ...post, upvotes, downvotes, user_vote: newVote });
      }
    } catch (err) {
      console.error("Vote failed:", err);
    } finally {
      setIsVoting(false);
    }
  };

  const handleAddComment = async () => {
    if (!token || !newComment.trim() || !post || !user) {
      if (!token) router.push("/auth/login");
      return;
    }

    const commentText = newComment.trim();
    const tempId = `temp_${Date.now()}`;
    
    // Haptic feedback on submit
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Optimistic UI update - add comment immediately
    const optimisticComment: ForumCommentWithAuthor = {
      id: tempId,
      post_id: post.id,
      parent_id: replyingTo?.id || null,
      author_id: user.id,
      author_name: (user as any).name || user.email?.split('@')[0] || "You",
      author_image_url: user.profileImageUrl || null,
      content: commentText,
      likes: 0,
      depth: replyingTo ? 1 : 0,
      user_liked: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      replies: [],
    };

    // Update UI optimistically
    if (replyingTo) {
      // Add to replies of parent comment
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === replyingTo.id) {
            return {
              ...comment,
              replies: [...(comment.replies || []), optimisticComment],
            };
          }
          // Also check nested replies
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === replyingTo.id
                  ? { ...reply, replies: [...(reply.replies || []), optimisticComment] }
                  : reply
              ),
            };
          }
          return comment;
        })
      );
    } else {
      // Add as top-level comment
      setComments((prev) => [optimisticComment, ...prev]);
    }

    setNewComment("");
    const previousReplyingTo = replyingTo;
    setReplyingTo(null);
    setIsSubmittingComment(true);

    try {
      if (previousReplyingTo) {
        await replyToComment(previousReplyingTo.id, commentText, token);
      } else {
        await addComment(post.id, commentText, token);
      }
      // Reload to get actual data with proper IDs
      await loadPost(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error("Failed to add comment:", err);
      Alert.alert("Error", "Failed to add comment");
      // Remove optimistic comment on error
      setComments((prev) =>
        prev.filter((c) => c.id !== tempId).map((c) => ({
          ...c,
          replies: c.replies?.filter((r) => r.id !== tempId),
        }))
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReplyPress = (commentId: string, authorName: string) => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Set reply context
    setReplyingTo({ id: commentId, name: authorName });
    
    // Focus input and open keyboard
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
    
    // Scroll to the comment being replied to
    const commentView = commentRefs.current.get(commentId);
    if (commentView && scrollViewRef.current) {
      commentView.measure((fx, fy, width, height, px, py) => {
        if (py) {
          // Scroll to position with offset
          scrollViewRef.current?.scrollToPosition(0, py - 100, true);
        }
      });
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    try {
      await likeComment(commentId, token);
      // Optimistically update UI
      setComments((prev) => prev.map((c) => updateCommentLike(c, commentId)));
    } catch (err) {
      console.error("Failed to like comment:", err);
    }
  };

  const updateCommentLike = (
    comment: ForumCommentWithAuthor,
    targetId: string,
  ): ForumCommentWithAuthor => {
    if (comment.id === targetId) {
      return {
        ...comment,
        user_liked: !comment.user_liked,
        likes: comment.user_liked ? comment.likes - 1 : comment.likes + 1,
      };
    }
    if (comment.replies) {
      return {
        ...comment,
        replies: comment.replies.map((r) => updateCommentLike(r, targetId)),
      };
    }
    return comment;
  };

  const handleReport = async (reason: ReportReason) => {
    if (!token || !post) return;

    const result = await reportContent("post", post.id, reason, token);
    if (result.success) {
      Alert.alert(
        "Report Submitted",
        "Thank you for helping keep our community safe.",
      );
    } else if (result.error) {
      throw new Error(result.error);
    }
  };

  const isAuthor = user?.id === post?.author_id;

  const handleDeletePost = () => {
    if (!token || !post) return;

    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deletePost(post.id, token);
              Alert.alert("Success", "Post deleted successfully", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch {
              Alert.alert("Error", "Failed to delete post");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleEditPost = () => {
    if (!post) return;
    setShowOptionsMenu(false);
    router.push(`/create-post?id=${post.id}` as never);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-danger-600 text-base mb-4">
          {error || "Post not found"}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const avatarUri = post.author_image_url || "https://via.placeholder.com/48";

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 pb-4 border-b border-neutral-100 bg-white"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft color="#374151" size={24} strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-neutral-900">Post</Text>
        <View className="flex-row items-center">
          {isAuthor ? (
            <TouchableOpacity
              onPress={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2"
            >
              <MoreVertical color="#6b7280" size={20} strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setShowReportModal(true)}
              className="p-2"
            >
              <Flag color="#6b7280" size={20} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Options Menu for Author */}
      {showOptionsMenu && isAuthor && (
        <View
          className="absolute right-4 bg-white rounded-xl shadow-lg z-50 border border-neutral-200"
          style={{ top: insets.top + 52 }}
        >
          <TouchableOpacity
            onPress={handleEditPost}
            className="flex-row items-center px-4 py-3 border-b border-neutral-100"
          >
            <Edit2 color="#4b5563" size={18} strokeWidth={2} />
            <Text className="text-neutral-700 font-medium ml-3">Edit Post</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setShowOptionsMenu(false);
              handleDeletePost();
            }}
            className="flex-row items-center px-4 py-3"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <Trash2 color="#dc2626" size={18} strokeWidth={2} />
            )}
            <Text className="text-danger-600 font-medium ml-3">
              Delete Post
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAwareScrollView
        ref={scrollViewRef}
        className="flex-1 bg-white"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadPost(true)}
            tintColor="#2563eb"
          />
        }
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setShowOptionsMenu(false)}
      >
        {/* Post Content */}
        <View className="px-6 py-4">
          {/* Author Header */}
          <View className="flex-row items-center mb-4">
            <Image
              source={{ uri: avatarUri }}
              className="w-12 h-12 rounded-full bg-neutral-200"
            />
            <View className="flex-1 ml-3">
              <Text className="text-base font-semibold text-neutral-900">
                {post.author_name}
              </Text>
              <Text className="text-sm text-neutral-500">
                {formatTimeAgo(post.created_at)}
              </Text>
            </View>
            <FlairBadge flair={post.flair} size="md" />
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-neutral-900 mb-3">
            {post.title}
          </Text>

          {/* Body */}
          <Text className="text-base text-neutral-700 leading-6 mb-4">
            {post.body}
          </Text>

          {/* Photo */}
          {post.photo_urls && post.photo_urls.length > 0 && (
            <View className="mb-4">
              <View className="flex-row flex-wrap gap-2">
              {post.photo_urls.map((photoUrl, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setSelectedImageIndex(index);
                    setShowImageZoom(true);
                  }}
                  activeOpacity={0.9}
                  style={{ marginRight: post.photo_urls!.length > 1 ? 12 : 0 }}
                >
                  <Image
                    source={{ uri: photoUrl }}
                    className="rounded-xl bg-neutral-200"
                    style={{
                      width: post.photo_urls!.length === 1 ? 350 : 280,
                      maxHeight: 400,
                      minHeight: 200,
                    }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
          )}

          {/* Location */}
          {post.location_tag && (
            <View className="flex-row items-center mb-4">
              <MapPin color="#6b7280" size={16} strokeWidth={2} />
              <Text className="text-sm text-neutral-600 ml-1">
                {post.location_tag}
              </Text>
            </View>
          )}

          {/* Vote Buttons */}
          <View className="flex-row items-center justify-between py-4 border-t border-b border-neutral-100">
            <VoteButtons
              upvotes={post.upvotes}
              userVote={post.user_vote}
              onVote={handleVote}
              isLoading={isVoting}
              size="md"
            />
          </View>
        </View>

        {/* Comments Section */}
        <View className="px-6 py-4">
          {/* Comment Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-neutral-900">
              Comments ({post.comment_count})
            </Text>
            <TouchableOpacity
              onPress={() => setShowSortMenu(!showSortMenu)}
              className="flex-row items-center"
            >
              <ArrowDown color="#6b7280" size={16} />
              <Text className="text-sm text-neutral-600 ml-1 capitalize">
                {commentSort}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sort Menu Dropdown */}
          {showSortMenu && (
            <View className="bg-neutral-50 rounded-xl mb-4 overflow-hidden">
              {(["popular", "newest", "oldest"] as CommentSort[]).map(
                (sort) => (
                  <TouchableOpacity
                    key={sort}
                    onPress={() => {
                      setCommentSort(sort);
                      setShowSortMenu(false);
                    }}
                    className={`px-4 py-3 flex-row items-center ${
                      commentSort === sort ? "bg-primary-50" : ""
                    }`}
                  >
                    {sort === "popular" && (
                      <TrendingUp color="#6b7280" size={16} />
                    )}
                    {sort === "newest" && <Clock color="#6b7280" size={16} />}
                    {sort === "oldest" && <Clock color="#6b7280" size={16} />}
                    <Text
                      className={`ml-2 capitalize ${
                        commentSort === sort
                          ? "text-primary-600 font-semibold"
                          : "text-neutral-700"
                      }`}
                    >
                      {sort}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <Text className="text-neutral-500 text-center py-8">
              No comments yet. Be the first!
            </Text>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={handleLikeComment}
                onReplyPress={handleReplyPress}
                onRef={(ref) => {
                  if (ref) commentRefs.current.set(comment.id, ref);
                }}
              />
            ))
          )}
        </View>
      </KeyboardAwareScrollView>

      {/* Top-Level Comment Input - Sticks to keyboard */}
      <View className="bg-white border-t border-neutral-200 px-4 py-3">
          {replyingTo && (
            <View className="flex-row items-center justify-between mb-2 px-2 py-1.5 bg-neutral-50 rounded-lg">
              <Text className="text-xs text-neutral-600">
                Replying to <Text className="font-semibold text-primary-600">@{replyingTo.name}</Text>
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)} className="p-0.5">
                <Text className="text-neutral-400 font-bold text-base">×</Text>
              </TouchableOpacity>
            </View>
          )}
          <View className="flex-row items-center">
            <TextInput
              ref={textInputRef}
              value={newComment}
              onChangeText={setNewComment}
              placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : "Write a comment..."}
              placeholderTextColor="#9ca3af"
              className="flex-1 bg-neutral-100 rounded-full px-4 py-2.5 text-sm text-neutral-900"
              maxLength={300}
              multiline
            />
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={!newComment.trim() || isSubmittingComment}
              className="ml-2"
            >
              {isSubmittingComment ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <Send
                  color={newComment.trim() ? "#2563eb" : "#9ca3af"}
                  size={22}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReport}
        contentType="post"
      />

      {/* Image Zoom Modal */}
      {post?.photo_urls && post.photo_urls.length > 0 && (
        <ImageZoomModal
          visible={showImageZoom}
          imageUrl={post.photo_urls[selectedImageIndex]}
          onClose={() => setShowImageZoom(false)}
        />
      )}
    </View>
  );
}
