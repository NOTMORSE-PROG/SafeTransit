// ForumPostCard Component
// Post preview card for forum feed

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { MessageCircle, MapPin, Clock } from "lucide-react-native";
import { FlairBadge } from "./FlairBadge";
import { VoteButtons } from "./VoteButtons";
import { ImageZoomModal } from "../ImageZoomModal";
import type { ForumPostWithAuthor } from "@/services/types/forum";

interface ForumPostCardProps {
  post: ForumPostWithAuthor;
  onPress: () => void;
  onVote: (voteType: "up" | "down") => void;
  isVoting?: boolean;
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

function getPreviewText(body: string, maxLength = 120): string {
  if (body.length <= maxLength) return body;
  return body.substring(0, maxLength).trim() + "...";
}

export function ForumPostCard({
  post,
  onPress,
  onVote,
  isVoting,
}: ForumPostCardProps) {
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="bg-white rounded-2xl p-4 mb-3 shadow-soft"
        accessibilityLabel={`Post: ${post.title}`}
        accessibilityRole="button"
      >
        {/* Header: Author + Flair */}
        <View className="flex-row items-center mb-3">
          <View className="w-10 h-10 rounded-full bg-neutral-200 items-center justify-center">
            {post.author_image_url ? (
              <Image
                source={{ uri: post.author_image_url }}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <Text className="text-neutral-600 font-semibold text-base">
                {post.author_name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-sm font-semibold text-neutral-900">
              {post.author_name}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <Clock color="#9ca3af" size={12} strokeWidth={2} />
              <Text className="text-xs text-neutral-400 ml-1">
                {formatTimeAgo(post.created_at)}
              </Text>
            </View>
          </View>
          <FlairBadge flair={post.flair} size="sm" />
        </View>

        {/* Title */}
        <Text className="text-base font-bold text-neutral-900 mb-1">
          {post.title}
        </Text>

        {/* Preview */}
        <Text className="text-sm text-neutral-600 leading-5 mb-3">
          {getPreviewText(post.body)}
        </Text>

        {/* Photo Preview (if exists) */}
        {post.photo_urls && post.photo_urls.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3 -mx-4"
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {post.photo_urls.map((photoUrl, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedImageIndex(index);
                  setShowImageZoom(true);
                }}
                activeOpacity={0.9}
                style={{ marginRight: post.photo_urls!.length > 1 ? 8 : 0 }}
              >
                <Image
                  source={{ uri: photoUrl }}
                  className="rounded-xl bg-neutral-200"
                  style={{
                    width: post.photo_urls!.length === 1 ? 320 : 200,
                    maxHeight: 240,
                    minHeight: 160,
                  }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Location Tag (if exists) */}
        {post.location_tag && (
          <View className="flex-row items-center mb-3">
            <MapPin color="#6b7280" size={14} strokeWidth={2} />
            <Text className="text-xs text-neutral-500 ml-1">
              {post.location_tag}
            </Text>
          </View>
        )}

        {/* Footer: Votes + Comments */}
        <View className="flex-row items-center justify-between pt-3 border-t border-neutral-100">
          <VoteButtons
            upvotes={post.upvotes}
            userVote={post.user_vote}
            onVote={onVote}
            isLoading={isVoting}
            size="sm"
          />

          <View className="flex-row items-center">
            <MessageCircle color="#6b7280" size={16} strokeWidth={2} />
            <Text className="text-sm font-medium text-neutral-600 ml-1">
              {post.comment_count}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Image Zoom Modal */}
      {post.photo_urls && post.photo_urls.length > 0 && (
        <ImageZoomModal
          visible={showImageZoom}
          imageUrl={post.photo_urls[selectedImageIndex]}
          onClose={() => setShowImageZoom(false)}
        />
      )}
    </>
  );
}
