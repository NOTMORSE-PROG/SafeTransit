// UserAvatar Component
// Display user profile picture or initials fallback

import React from "react";
import { View, Image, Text } from "react-native";

interface UserAvatarProps {
  imageUrl: string | null | undefined;
  name: string;
  size?: number;
}

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

const getBackgroundColor = (name: string): string => {
  // Generate consistent color based on name
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

export function UserAvatar({ imageUrl, name, size = 32 }: UserAvatarProps) {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#e5e7eb",
        }}
      />
    );
  }

  // Fallback to initials
  const initials = getInitials(name);
  const backgroundColor = getBackgroundColor(name);
  const fontSize = size * 0.4;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "#ffffff",
          fontSize,
          fontWeight: "600",
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
