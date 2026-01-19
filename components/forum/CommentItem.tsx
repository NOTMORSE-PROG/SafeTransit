// CommentItem Component
// Display comment with likes, replies, and reply UI

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  ThumbsUp,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react-native";
import type { ForumCommentWithAuthor } from "@/services/types/forum";

interface CommentItemProps {
  comment: ForumCommentWithAuthor;
  onLike: (commentId: string) => Promise<void>;
  onReply: (
    commentId: string,
    content: string,
    _isReplying: boolean,
  ) => Promise<void>;
  isLiking?: boolean;
  isReplying?: boolean;
  isNested?: boolean;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;
  return "Just now";
}

export function CommentItem({
  comment,
  onLike,
  onReply,
  isLiking = false,
  isReplying: _isReplying = false,
  isNested = false,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [localIsReplying, setLocalIsReplying] = useState(false);

  const avatarUri =
    comment.author_image_url || "https://via.placeholder.com/32";
  const hasReplies = comment.replies && comment.replies.length > 0;
  const canReply = comment.depth < 999; // Allow replying up to max depth (essentially unlimited like Facebook)

  const handleSubmitReply = async () => {
    if (!replyText.trim() || localIsReplying) return;

    setLocalIsReplying(true);
    try {
      await onReply(comment.id, replyText.trim(), true);
      setReplyText("");
      setShowReplyInput(false);
    } finally {
      setLocalIsReplying(false);
    }
  };

  // Dynamic indentation based on depth to prevent squashing on deep threads
  // Top level: 0, First reply: ml-8 (32px), Subsequent: ml-4 (16px)
  const indentClass = isNested
    ? comment.depth > 1
      ? "ml-3 mt-2 border-l-2 border-neutral-100 pl-3"
      : "ml-8 mt-3"
    : "mt-4";

  return (
    <View className={indentClass}>
      <View className="flex-row">
        <Image
          source={{ uri: avatarUri }}
          className="w-8 h-8 rounded-full bg-neutral-200"
        />
        <View className="flex-1 ml-3">
          {/* Author + Time */}
          <View className="flex-row items-center">
            <Text className="text-sm font-semibold text-neutral-900">
              {comment.author_name}
            </Text>
            <Text className="text-xs text-neutral-400 ml-2">
              {formatTimeAgo(comment.created_at)}
            </Text>
          </View>

          {/* Content */}
          <Text className="text-sm text-neutral-700 mt-1 leading-5">
            {comment.content}
          </Text>

          {/* Actions */}
          <View className="flex-row items-center mt-2">
            {/* Like Button */}
            <TouchableOpacity
              onPress={() => onLike(comment.id)}
              disabled={isLiking}
              className="flex-row items-center mr-4"
              activeOpacity={0.7}
            >
              {isLiking ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <>
                  <ThumbsUp
                    color={comment.user_liked ? "#2563eb" : "#6b7280"}
                    size={16}
                    strokeWidth={2}
                    fill={comment.user_liked ? "#bfdbfe" : "none"}
                  />
                  <Text
                    className={`text-xs font-medium ml-1 ${
                      comment.user_liked
                        ? "text-primary-600"
                        : "text-neutral-500"
                    }`}
                  >
                    {comment.likes}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Reply Button (only for top-level) */}
            {canReply && (
              <TouchableOpacity
                onPress={() => setShowReplyInput(!showReplyInput)}
                className="flex-row items-center"
                activeOpacity={0.7}
              >
                <MessageCircle color="#6b7280" size={16} strokeWidth={2} />
                <Text className="text-xs font-medium text-neutral-500 ml-1">
                  Reply
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Reply Input */}
          {showReplyInput && (
            <View className="flex-row items-center mt-3 bg-neutral-50 rounded-xl px-3 py-2">
              <Text className="text-xs text-primary-600 font-medium mr-2">
                @{comment.author_name}
              </Text>
              <TextInput
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Write a reply..."
                placeholderTextColor="#9ca3af"
                className="flex-1 text-sm text-neutral-900"
                maxLength={300}
                multiline
              />
              <TouchableOpacity
                onPress={handleSubmitReply}
                disabled={!replyText.trim() || localIsReplying}
                className={`p-2 rounded-full ${
                  replyText.trim() ? "bg-primary-600" : "bg-neutral-200"
                }`}
              >
                {localIsReplying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Send
                    color={replyText.trim() ? "#fff" : "#9ca3af"}
                    size={14}
                  />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Replies Section */}
      {hasReplies && (
        <View className="ml-8 mt-2">
          <TouchableOpacity
            onPress={() => setShowReplies(!showReplies)}
            className="flex-row items-center py-1"
            activeOpacity={0.7}
          >
            {showReplies ? (
              <ChevronUp color="#6b7280" size={14} />
            ) : (
              <ChevronDown color="#6b7280" size={14} />
            )}
            <Text className="text-xs font-medium text-neutral-500 ml-1">
              {showReplies ? "Hide" : "Show"} {comment.replies!.length}{" "}
              {comment.replies!.length === 1 ? "reply" : "replies"}
            </Text>
          </TouchableOpacity>

          {showReplies &&
            comment.replies!.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onLike={onLike}
                onReply={onReply}
                isNested
              />
            ))}
        </View>
      )}
    </View>
  );
}
