import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Lightbulb,
  AlertTriangle,
  Bus,
  Shield,
  Construction,
  MapPin,
  Calendar,
  Trash2,
  Edit3,
} from 'lucide-react-native';
import { Tip, getMyTips, getCategoryColor, getTimeRelevanceEmoji } from '../services/tipsService';
import { colors } from '../constants/theme';
import { format } from 'date-fns';

export default function MyTips() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tips, setTips] = useState<Tip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadMyTips();
  }, []);

  const loadMyTips = async () => {
    try {
      setIsLoading(true);
      const userTips = await getMyTips();
      setTips(userTips);
    } catch (error) {
      console.error('Error loading tips:', error);
      Alert.alert('Error', 'Failed to load your tips. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMyTips();
    setIsRefreshing(false);
  };

  const handleDeleteTip = (tipId: string) => {
    Alert.alert(
      'Delete Tip',
      'Are you sure you want to delete this tip? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete API call
            setTips(tips.filter((tip) => tip.id !== tipId));
            Alert.alert('Success', 'Tip deleted successfully');
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lighting':
        return Lightbulb;
      case 'harassment':
        return AlertTriangle;
      case 'transit':
        return Bus;
      case 'safe_haven':
        return Shield;
      case 'construction':
        return Construction;
      default:
        return MapPin;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-primary-600" style={{ paddingTop: insets.top + 12 }}>
        <View className="px-6 pb-6">
          <View className="flex-row items-center mb-2">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 w-8 h-8 items-center justify-center"
              activeOpacity={0.7}
            >
              <ArrowLeft color="#ffffff" size={24} strokeWidth={2} />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold flex-1">My Safety Tips</Text>
          </View>
          <Text className="text-white/80 text-sm">
            {tips.length} {tips.length === 1 ? 'tip' : 'tips'} shared with the community
          </Text>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text className="text-neutral-500 mt-4">Loading your tips...</Text>
        </View>
      ) : tips.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-neutral-100 rounded-full items-center justify-center mb-4">
            <Lightbulb color={colors.neutral[400]} size={40} strokeWidth={2} />
          </View>
          <Text className="text-xl font-bold text-neutral-900 mb-2">No tips yet</Text>
          <Text className="text-neutral-600 text-center mb-6">
            Start helping your community by sharing safety tips about your neighborhood
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/add-tip')}
            className="bg-primary-600 px-6 py-3 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">Add Your First Tip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6 py-4"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary[600]}
            />
          }
        >
          {tips.map((tip, index) => {
            const CategoryIcon = getCategoryIcon(tip.category);
            const categoryColor = getCategoryColor(tip.category);
            const timeEmoji = getTimeRelevanceEmoji(tip.time_relevance);

            return (
              <Animated.View
                key={tip.id}
                entering={FadeInDown.delay(index * 100).duration(400)}
              >
                <View className="bg-white rounded-2xl p-4 mb-4 border-2 border-neutral-100">
                  {/* Header */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: `${categoryColor}20` }}
                      >
                        <CategoryIcon color={categoryColor} size={20} strokeWidth={2} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <View
                            className="px-2 py-1 rounded-md mr-2"
                            style={{ backgroundColor: `${categoryColor}20` }}
                          >
                            <Text className="text-xs font-semibold capitalize" style={{ color: categoryColor }}>
                              {tip.category.replace('_', ' ')}
                            </Text>
                          </View>
                          <Text className="text-xs text-neutral-500">
                            {timeEmoji} {tip.time_relevance}
                          </Text>
                        </View>
                        <Text className="text-base font-bold text-neutral-900">{tip.title}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Message */}
                  <Text className="text-sm text-neutral-700 leading-5 mb-3">{tip.message}</Text>

                  {/* Location */}
                  <View className="flex-row items-center mb-3">
                    <MapPin size={14} color={colors.neutral[400]} />
                    <Text className="text-xs text-neutral-600 ml-1 flex-1" numberOfLines={1}>
                      {tip.location_name}
                    </Text>
                  </View>

                  {/* Footer */}
                  <View className="flex-row items-center justify-between pt-3 border-t border-neutral-100">
                    <View className="flex-row items-center">
                      <Calendar size={14} color={colors.neutral[400]} />
                      <Text className="text-xs text-neutral-500 ml-1">
                        {formatDate(tip.created_at)}
                      </Text>
                    </View>

                    <View className="flex-row gap-2">
                      {/* Edit Button - Coming soon */}
                      <TouchableOpacity
                        className="bg-primary-50 px-3 py-2 rounded-lg flex-row items-center"
                        activeOpacity={0.7}
                        onPress={() => Alert.alert('Coming Soon', 'Edit functionality will be available soon')}
                      >
                        <Edit3 size={14} color={colors.primary[600]} />
                        <Text className="text-xs font-semibold text-primary-600 ml-1">Edit</Text>
                      </TouchableOpacity>

                      {/* Delete Button */}
                      <TouchableOpacity
                        className="bg-danger-50 px-3 py-2 rounded-lg flex-row items-center"
                        activeOpacity={0.7}
                        onPress={() => handleDeleteTip(tip.id)}
                      >
                        <Trash2 size={14} color={colors.danger[600]} />
                        <Text className="text-xs font-semibold text-danger-600 ml-1">Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
