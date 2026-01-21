// FlairBadge Component
// Displays post flair with emoji and color coding

import React from 'react';
import { View, Text } from 'react-native';
import type { PostFlair } from '@/services/types/forum';
import { FLAIR_CONFIG } from '@/services/types/forum';

interface FlairBadgeProps {
  flair: PostFlair;
  size?: 'sm' | 'md';
}

const FLAIR_COLORS: Record<string, { bg: string; text: string }> = {
  neutral: { bg: 'bg-neutral-100', text: 'text-neutral-700' },
  secondary: { bg: 'bg-secondary-100', text: 'text-secondary-700' },
  info: { bg: 'bg-info-50', text: 'text-info-700' },
  primary: { bg: 'bg-primary-100', text: 'text-primary-700' },
  safe: { bg: 'bg-safe-100', text: 'text-safe-700' },
};

export function FlairBadge({ flair, size = 'sm' }: FlairBadgeProps) {
  const config = FLAIR_CONFIG[flair];
  const colors = FLAIR_COLORS[config.color];
  
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5' 
    : 'px-3 py-1';
  
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <View className={`flex-row items-center rounded-full ${sizeClasses} ${colors.bg}`}>
      <Text className={`${textSize} mr-1`}>{config.emoji}</Text>
      <Text className={`${textSize} font-medium ${colors.text}`}>
        {config.label}
      </Text>
    </View>
  );
}
