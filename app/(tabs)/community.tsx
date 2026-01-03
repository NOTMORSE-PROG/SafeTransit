import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Search, LayoutGrid, Lightbulb, ShieldAlert, Bus, ThumbsUp, MapPin, SearchX } from 'lucide-react-native';

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
  { id: 'all', label: 'All', icon: 'LayoutGrid' },
  { id: 'lighting', label: 'Lighting', icon: 'Lightbulb' },
  { id: 'safety', label: 'Safety', icon: 'ShieldAlert' },
  { id: 'transit', label: 'Transit', icon: 'Bus' }
];

export default function Community() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lighting':
        return Lightbulb;
      case 'safety':
        return ShieldAlert;
      case 'transit':
        return Bus;
      default:
        return LayoutGrid;
    }
  };

  const filteredTips = MOCK_COMMUNITY_TIPS.filter(tip => {
    const matchesCategory = selectedCategory === 'all' || tip.category === selectedCategory;
    const matchesSearch = tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tip.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Header */}
      <View className="bg-white pt-14 pb-4 px-6 border-b border-neutral-100">
        <Text className="text-3xl font-bold text-neutral-900 mb-4">
          Community Tips
        </Text>

        {/* Search */}
        <View className="bg-neutral-100 rounded-xl px-4 py-3 flex-row items-center mb-4">
          <Search color="#6b7280" size={20} strokeWidth={2} />
          <TextInput
            placeholder="Search tips or locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-base text-neutral-900 ml-2"
            placeholderTextColor="#9CA3AF"
            accessible={true}
            accessibilityLabel="Search community tips"
          />
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row -mx-6 px-6"
        >
          {CATEGORIES.map((category) => {
            const IconComponent = category.icon === 'LayoutGrid' ? LayoutGrid :
                                  category.icon === 'Lightbulb' ? Lightbulb :
                                  category.icon === 'ShieldAlert' ? ShieldAlert : Bus;
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                className={`mr-3 px-4 py-2 rounded-full ${
                  selectedCategory === category.id
                    ? 'bg-primary-600'
                    : 'bg-neutral-200'
                }`}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel={`Filter by ${category.label}`}
                accessibilityRole="button"
              >
                <View className="flex-row items-center">
                  <IconComponent
                    color={selectedCategory === category.id ? "#ffffff" : "#374151"}
                    size={16}
                    strokeWidth={2}
                  />
                  <Text
                    className={`text-sm font-semibold ml-1.5 ${
                      selectedCategory === category.id
                        ? 'text-white'
                        : 'text-neutral-700'
                    }`}
                  >
                    {category.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tips List */}
      <ScrollView className="flex-1 px-6 py-4">
        {filteredTips.map((tip, index) => {
          const TipIcon = getCategoryIcon(tip.category);
          return (
            <Animated.View
              key={tip.id}
              entering={FadeInDown.delay(index * 100).duration(600)}
            >
              <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                {/* Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-start flex-1">
                    <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3">
                      <TipIcon color="#2563eb" size={20} strokeWidth={2} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-neutral-900 mb-1">
                        {tip.title}
                      </Text>
                      <View className="flex-row items-center">
                        <MapPin color="#6b7280" size={12} strokeWidth={2} />
                        <Text className="text-xs text-neutral-500 ml-1">
                          {tip.location}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Message */}
                <Text className="text-sm text-neutral-700 leading-5 mb-3">
                  {tip.message}
                </Text>

                {/* Footer */}
                <View className="flex-row items-center justify-between pt-3 border-t border-neutral-100">
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      className="flex-row items-center bg-primary-50 rounded-lg px-3 py-2"
                      activeOpacity={0.7}
                      accessible={true}
                      accessibilityLabel={`Upvote tip, ${tip.upvotes} upvotes`}
                      accessibilityRole="button"
                    >
                      <ThumbsUp color="#2563eb" size={16} strokeWidth={2} />
                      <Text className="text-sm font-semibold text-primary-600 ml-1.5">
                        {tip.upvotes}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text className="text-xs text-neutral-400">
                    {tip.timeAgo}
                  </Text>
                </View>
              </View>
            </Animated.View>
          );
        })}

        {filteredTips.length === 0 && (
          <View className="items-center justify-center py-20">
            <SearchX color="#9ca3af" size={64} strokeWidth={1.5} />
            <Text className="text-neutral-500 text-base mt-4">
              No tips found
            </Text>
          </View>
        )}

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
