// CommentItem Component
// Display comment with likes, replies, and reply UI

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ThumbsUp, ChevronDown, ChevronUp } from "lucide-react-native";
import type { ForumCommentWithAuthor } from "@/services/types/forum";

interface CommentItemProps {
  comment: ForumCommentWithAuthor;
  onLike: (commentId: string) => Promise<void>;
  onReplyPress: (commentId: string, authorName: string) => void;
  isLiking?: boolean;
  isNested?: boolean;
  onRef?: (ref: View | null) => void;
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
  onReplyPress,
  isLiking = false,
  isNested = false,
  onRef,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);

  // Animation for replies expand/collapse
  const repliesHeight = useSharedValue(0);
  const repliesOpacity = useSharedValue(0);

  useEffect(() => {
    if (showReplies) {
      repliesHeight.value = withSpring(1, {
        damping: 20,
        stiffness: 90,
      });
      repliesOpacity.value = withTiming(1, { duration: 300 });
    } else {
      repliesHeight.value = withTiming(0, { duration: 200 });
      repliesOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [showReplies, repliesHeight, repliesOpacity]);

  const animatedRepliesStyle = useAnimatedStyle(() => ({
    opacity: repliesOpacity.value,
    transform: [{ scaleY: repliesHeight.value }],
    transformOrigin: "top",
  }));

  const avatarUri =
    comment.author_image_url || "https://via.placeholder.com/32";
  const hasReplies = comment.replies && comment.replies.length > 0;

  // Facebook-style indentation: only indent the first reply level, all deeper replies stay at same level
  // Level 0 (top comment): no indent
  // Level 1+ (all replies): ml-8 (stays same for all nested replies)
  const indentClass = isNested ? "ml-8 mt-3" : "mt-4";

  const handleToggleReplies = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowReplies(!showReplies);
  };

  return (
    <View className={indentClass} ref={(ref) => onRef?.(ref)} collapsable={false}>
      {/* Thread connector line for nested comments */}
      {isNested && (
        <View className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-200" />
      )}
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
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onLike(comment.id);
              }}
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

            {/* Reply Button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onReplyPress(comment.id, comment.author_name);
              }}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-neutral-600">
                Reply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Replies Section */}
      {hasReplies && (
        <View className="ml-8 mt-2">
          <TouchableOpacity
            onPress={handleToggleReplies}
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

          {showReplies && (
            <Animated.View style={animatedRepliesStyle}>
              {comment.replies!.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onLike={onLike}
                  onReplyPress={onReplyPress}
                  onRef={onRef}
                  isNested
                />
              ))}
            </Animated.View>
          )}
        </View>
      )}
    </View>
  );
}
