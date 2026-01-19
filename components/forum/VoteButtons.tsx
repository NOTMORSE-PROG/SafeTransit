// VoteButtons Component
// Reusable like/upvote button

import React from "react";
import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { ThumbsUp } from "lucide-react-native";

interface VoteButtonsProps {
  upvotes: number;
  userVote?: "up" | "down" | null;
  onVote: (voteType: "up" | "down") => void;
  isLoading?: boolean;
  size?: "sm" | "md";
  _showNet?: boolean;
}

export function VoteButtons({
  upvotes,
  userVote,
  onVote,
  isLoading = false,
  size = "md",
  _showNet = false,
}: VoteButtonsProps) {
  const iconSize = size === "sm" ? 16 : 20;
  const buttonPadding = size === "sm" ? "p-1.5" : "p-2";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <View className="flex-row items-center">
      {/* Like Button */}
      <TouchableOpacity
        onPress={() => onVote("up")}
        disabled={isLoading}
        className={`flex-row items-center ${buttonPadding} rounded-lg ${
          userVote === "up" ? "bg-primary-100" : "bg-neutral-100"
        }`}
        activeOpacity={0.7}
        accessibilityLabel={`Like, ${upvotes} likes`}
        accessibilityRole="button"
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#2563eb" />
        ) : (
          <>
            <ThumbsUp
              color={userVote === "up" ? "#2563eb" : "#6b7280"}
              size={iconSize}
              strokeWidth={userVote === "up" ? 2.5 : 2}
              fill={userVote === "up" ? "#bfdbfe" : "none"}
            />
            <Text
              className={`${textSize} font-semibold ml-1 ${
                userVote === "up" ? "text-primary-600" : "text-neutral-600"
              }`}
            >
              {upvotes}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
