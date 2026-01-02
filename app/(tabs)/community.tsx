import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const MOCK_COMMUNITY_TIPS = [
  {
    id: '1',
    category: 'lighting',
    title: 'Well-Lit MRT Exit',
    location: 'Ayala Station, Exit 3',
    message: 'Exit 3 is well-lit with security guards present until 11 PM. Safest option for evening commutes.',
    upvotes: 45,
    timeAgo: '2 hours ago'
  },
  {
    id: '2',
    category: 'safety',
    title: 'Avoid After Dark',
    location: 'P. Burgos Street',
    message: 'Street lights are broken here. Use alternate route via Ayala Avenue after 8 PM.',
    upvotes: 32,
    timeAgo: '5 hours ago'
  },
  {
    id: '3',
    category: 'transit',
    title: 'Safe Jeepney Route',
    location: 'Buendia to Taft',
    message: 'Board jeepney at Buendia corner Ayala. Driver is reliable and route is well-populated.',
    upvotes: 28,
    timeAgo: '1 day ago'
  },
  {
    id: '4',
    category: 'lighting',
    title: 'Security Camera Zone',
    location: 'Greenbelt Area',
    message: 'Full CCTV coverage and roving security. Very safe for walking.',
    upvotes: 67,
    timeAgo: '2 days ago'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '📌' },
  { id: 'lighting', label: 'Lighting', emoji: '💡' },
  { id: 'safety', label: 'Safety', emoji: '🛡️' },
  { id: 'transit', label: 'Transit', emoji: '🚌' }
];

export default function Community() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'lighting':
        return '💡';
      case 'safety':
        return '⚠️';
      case 'transit':
        return '🚌';
      default:
        return '📌';
    }
  };

  const filteredTips = MOCK_COMMUNITY_TIPS.filter(tip => {
    const matchesCategory = selectedCategory === 'all' || tip.category === selectedCategory;
    const matchesSearch = tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tip.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-14 pb-4 px-6 border-b border-gray-100">
        <Text className="text-3xl font-bold text-gray-900 mb-4">
          Community Tips
        </Text>

        {/* Search */}
        <View className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center mb-4">
          <Text className="text-xl mr-2">🔍</Text>
          <TextInput
            placeholder="Search tips or locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-base text-gray-900"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row -mx-6 px-6"
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              className={`mr-3 px-4 py-2 rounded-full ${
                selectedCategory === category.id
                  ? 'bg-primary-600'
                  : 'bg-gray-200'
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Text className="text-base mr-1">{category.emoji}</Text>
                <Text
                  className={`text-sm font-semibold ${
                    selectedCategory === category.id
                      ? 'text-white'
                      : 'text-gray-700'
                  }`}
                >
                  {category.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tips List */}
      <ScrollView className="flex-1 px-6 py-4">
        {filteredTips.map((tip, index) => (
          <Animated.View
            key={tip.id}
            entering={FadeInDown.delay(index * 100).duration(600)}
          >
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              {/* Header */}
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-row items-start flex-1">
                  <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3">
                    <Text className="text-xl">{getCategoryEmoji(tip.category)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-gray-900 mb-1">
                      {tip.title}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      📍 {tip.location}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Message */}
              <Text className="text-sm text-gray-700 leading-5 mb-3">
                {tip.message}
              </Text>

              {/* Footer */}
              <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                <View className="flex-row items-center">
                  <TouchableOpacity
                    className="flex-row items-center bg-primary-50 rounded-lg px-3 py-2"
                    activeOpacity={0.7}
                  >
                    <Text className="text-base mr-1">👍</Text>
                    <Text className="text-sm font-semibold text-primary-600">
                      {tip.upvotes}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-xs text-gray-400">
                  {tip.timeAgo}
                </Text>
              </View>
            </View>
          </Animated.View>
        ))}

        {filteredTips.length === 0 && (
          <View className="items-center justify-center py-20">
            <Text className="text-6xl mb-4">🔍</Text>
            <Text className="text-gray-500 text-base">
              No tips found
            </Text>
          </View>
        )}

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
