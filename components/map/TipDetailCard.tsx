import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { X, MapPin, Clock, User, AlertTriangle, CheckCircle, ThumbsUp, Share2 } from 'lucide-react-native';
import { Tip, getCategoryColor, getTimeRelevanceEmoji } from '@/services/tipsService';
import { colors } from '@/constants/theme';
import { format, formatDistanceToNow } from 'date-fns';
import * as Haptics from 'expo-haptics';

// Get API base URL
const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (__DEV__) {
    return 'http://localhost:3000';
  }
  return 'https://safetransit.vercel.app';
};

interface TipDetailCardProps {
  tip: Tip;
  onClose: () => void;
}

const TipDetailCard: React.FC<TipDetailCardProps> = ({ tip, onClose }) => {
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(tip.helpful_count || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryColor = getCategoryColor(tip.category);
  const timeEmoji = getTimeRelevanceEmoji(tip.time_relevance);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Unknown date';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'some time ago';
    }
  };

  const getSeverityInfo = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { color: colors.danger[500], bgColor: colors.danger[50], label: 'CRITICAL ALERT', icon: true };
      case 'high':
        return { color: colors.caution[600], bgColor: colors.caution[50], label: 'HIGH PRIORITY', icon: true };
      case 'medium':
        return { color: colors.caution[500], bgColor: colors.caution[50], label: 'MODERATE', icon: false };
      default:
        return { color: colors.neutral[500], bgColor: colors.neutral[50], label: 'LOW PRIORITY', icon: false };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success[500];
      case 'resolved':
        return colors.neutral[500];
      case 'outdated':
        return colors.caution[500];
      default:
        return colors.neutral[400];
    }
  };

  const handleHelpful = async () => {
    if (isHelpful || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Call backend API to mark as helpful
      const response = await fetch(`${getApiUrl()}/api/forum/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authorization header when user auth is implemented
          // 'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          action: 'helpful',
          content_type: 'tip',
          content_id: tip.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setIsHelpful(true);
        setHelpfulCount(data.data.helpful_count);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error(data.error || 'Failed to mark as helpful');
      }
    } catch (error) {
      console.error('[TipDetailCard] Error marking tip as helpful:', error);
      // Still optimistically update UI even if API fails
      setIsHelpful(true);
      setHelpfulCount(prev => prev + 1);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement share functionality
    console.log('Share tip:', tip.id);
  };

  const severityInfo = getSeverityInfo(tip.severity);

  return (
    <View className="bg-white rounded-3xl shadow-2xl" style={{ maxHeight: '90%', flexShrink: 1 }}>
      {/* Severity Banner */}
      {(tip.severity === 'critical' || tip.severity === 'high') && (
        <View
          className="px-4 py-2 rounded-t-3xl flex-row items-center"
          style={{ backgroundColor: severityInfo.bgColor }}
        >
          {severityInfo.icon && <AlertTriangle color={severityInfo.color} size={16} />}
          <Text className="ml-2 text-xs font-bold" style={{ color: severityInfo.color }}>
            {severityInfo.label}
          </Text>
        </View>
      )}

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <View className="flex-1">
          <View className="flex-row items-center mb-1 flex-wrap">
            <View
              className="px-3 py-1 rounded-full mr-2"
              style={{ backgroundColor: `${categoryColor}20` }}
            >
              <Text className="text-xs font-semibold capitalize" style={{ color: categoryColor }}>
                {tip.category.replace('_', ' ')}
              </Text>
            </View>
            <Text className="text-xs text-gray-500">
              {timeEmoji} {tip.time_relevance}
            </Text>

            {/* Status Badge */}
            <View
              className="px-2 py-1 rounded-full ml-2"
              style={{ backgroundColor: `${getStatusColor(tip.status_lifecycle)}20` }}
            >
              <Text className="text-xs font-semibold capitalize" style={{ color: getStatusColor(tip.status_lifecycle) }}>
                {tip.status_lifecycle}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={onClose}
          className="p-2 bg-gray-100 rounded-full"
          accessible={true}
          accessibilityLabel="Close tip details"
        >
          <X size={20} color={colors.neutral[500]} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="px-4" 
        showsVerticalScrollIndicator={true} 
        style={{ flexGrow: 0, flexShrink: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        nestedScrollEnabled={true}
        scrollEnabled={true}
      >
        {/* Verification Badge */}
        {tip.verified && (
          <View className="flex-row items-center mb-3 bg-green-50 px-3 py-2 rounded-lg">
            <CheckCircle color={colors.success[500]} size={18} fill={colors.success[500]} />
            <Text className="ml-2 text-sm font-semibold" style={{ color: colors.success[600] }}>
              Verified by {tip.verification_source || 'community'}
            </Text>
          </View>
        )}

        {/* Title */}
        <Text className="text-xl font-bold text-gray-900 mb-2">{tip.title}</Text>

        {/* Location */}
        <View className="flex-row items-center mb-3">
          <MapPin size={16} color={colors.neutral[500]} />
          <Text className="text-sm text-gray-600 ml-1 flex-1" numberOfLines={1}>
            {tip.location_name}
          </Text>
        </View>

        {/* Photo */}
        {tip.photo_url && (
          <Image
            source={{ uri: tip.photo_url }}
            className="w-full h-48 rounded-lg mb-4"
            resizeMode="cover"
          />
        )}

        {/* Message */}
        <Text className="text-base text-gray-700 leading-6 mb-4">{tip.message}</Text>

        {/* Actions Row */}
        <View className="flex-row items-center justify-between mb-4 bg-gray-50 rounded-xl p-3">
          <TouchableOpacity
            onPress={handleHelpful}
            disabled={isHelpful || isSubmitting}
            className="flex-row items-center px-4 py-2 rounded-lg"
            style={{
              backgroundColor: isHelpful ? colors.primary[100] : 'white',
              borderWidth: 1,
              borderColor: isHelpful ? colors.primary[500] : colors.neutral[300],
            }}
            accessible={true}
            accessibilityLabel={isHelpful ? 'Marked as helpful' : 'Mark as helpful'}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            ) : (
              <>
                <ThumbsUp
                  size={18}
                  color={isHelpful ? colors.primary[500] : colors.neutral[600]}
                  fill={isHelpful ? colors.primary[500] : 'transparent'}
                />
                <Text
                  className="ml-2 font-semibold"
                  style={{ color: isHelpful ? colors.primary[600] : colors.neutral[700] }}
                >
                  {isHelpful ? 'Helpful' : 'Helpful?'} ({helpfulCount})
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            className="p-3 rounded-lg"
            style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[300] }}
            accessible={true}
            accessibilityLabel="Share tip"
          >
            <Share2 size={18} color={colors.neutral[600]} />
          </TouchableOpacity>
        </View>

        {/* Last Confirmed */}
        {tip.last_confirmed_at && tip.confirmed_by_count > 0 && (
          <View className="bg-blue-50 px-3 py-2 rounded-lg mb-4">
            <Text className="text-xs text-blue-700">
              ✓ Last confirmed {formatRelativeTime(tip.last_confirmed_at)} by {tip.confirmed_by_count} {tip.confirmed_by_count === 1 ? 'user' : 'users'}
            </Text>
          </View>
        )}

        {/* Author & Date */}
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-200 mb-3">
          <View className="flex-row items-center">
            <User size={16} color={colors.neutral[500]} />
            <Text className="text-sm text-gray-600 ml-1">
              {tip.author_name || 'Anonymous'}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Clock size={16} color={colors.neutral[500]} />
            <Text className="text-sm text-gray-600 ml-1">{formatDate(tip.created_at)}</Text>
          </View>
        </View>

        {/* Temporary indicator */}
        {tip.is_temporary && tip.expires_at && (
          <View className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <Text className="text-xs text-amber-800">
              ⚠️ Temporary tip - Expires {formatDate(tip.expires_at)}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default TipDetailCard;
