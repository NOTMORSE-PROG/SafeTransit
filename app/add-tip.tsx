import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

const CATEGORIES = [
  { id: 'lighting', label: 'Lighting', emoji: '💡', description: 'Well-lit or poorly lit areas' },
  { id: 'harassment', label: 'Harassment', emoji: '⚠️', description: 'Areas with harassment reports' },
  { id: 'construction', label: 'Construction', emoji: '🚧', description: 'Construction zones or blocked paths' },
  { id: 'safe_haven', label: 'Safe Haven', emoji: '🛡️', description: 'Safe spaces and help points' },
  { id: 'transit', label: 'Transit', emoji: '🚌', description: 'Transit tips and exit info' }
];

export default function AddTip() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('Current Location');
  const [hasPhoto, setHasPhoto] = useState(false);

  const handlePickImage = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setHasPhoto(true);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !title.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      'Tip Submitted',
      'Your tip has been submitted for verification. Thank you for keeping our community safe!',
      [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-primary-600 pt-12 pb-6 px-6">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 w-8 h-8 items-center justify-center"
            activeOpacity={0.7}
          >
            <Text className="text-white text-3xl font-light">×</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold flex-1">
            Add Community Tip
          </Text>
        </View>
        <Text className="text-white/80 text-sm">
          Help keep others safe by sharing local knowledge
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Location */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Location
          </Text>
          <TouchableOpacity
            className="bg-gray-100 rounded-xl px-4 py-3 mb-6"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Text className="text-xl mr-2">📍</Text>
                <Text className="text-base text-gray-900">{location}</Text>
              </View>
              <Text className="text-primary-600 text-sm font-semibold">
                Change
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Category Selection */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Category <Text className="text-danger-600">*</Text>
          </Text>
          <View className="mb-6">
            {CATEGORIES.map((category, index) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => {
                  setSelectedCategory(category.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className={`mb-3 rounded-xl p-4 border-2 ${
                  selectedCategory === category.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
                      selectedCategory === category.id
                        ? 'bg-primary-600'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text className="text-2xl">{category.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                      {category.label}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {category.description}
                    </Text>
                  </View>
                  {selectedCategory === category.id && (
                    <View className="bg-primary-600 rounded-full p-1">
                      <Text className="text-white text-xs">✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Title <Text className="text-danger-600">*</Text>
          </Text>
          <TextInput
            placeholder="e.g., Well-lit MRT exit"
            value={title}
            onChangeText={setTitle}
            className="bg-gray-100 rounded-xl px-4 py-3 text-base text-gray-900 mb-6"
            placeholderTextColor="#9CA3AF"
            maxLength={50}
          />
        </Animated.View>

        {/* Message */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Message <Text className="text-danger-600">*</Text>
          </Text>
          <TextInput
            placeholder="Share details that could help others stay safe..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            className="bg-gray-100 rounded-xl px-4 py-3 text-base text-gray-900 mb-6"
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
            maxLength={300}
          />
          <Text className="text-xs text-gray-500 text-right -mt-4 mb-6">
            {message.length}/300
          </Text>
        </Animated.View>

        {/* Photo Upload */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Photo (Optional)
          </Text>
          <TouchableOpacity
            onPress={handlePickImage}
            className={`rounded-xl px-4 py-8 mb-6 border-2 border-dashed ${
              hasPhoto
                ? 'border-success-500 bg-success-50'
                : 'border-gray-300 bg-gray-50'
            }`}
            activeOpacity={0.7}
          >
            <View className="items-center">
              <Text className="text-4xl mb-2">
                {hasPhoto ? '✓' : '📷'}
              </Text>
              <Text className="text-base font-semibold text-gray-900 mb-1">
                {hasPhoto ? 'Photo Added' : 'Add Photo'}
              </Text>
              <Text className="text-sm text-gray-600">
                {hasPhoto ? 'Tap to change' : 'Optional but helpful for verification'}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Privacy Notice */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)}>
          <View className="bg-blue-50 rounded-xl p-4 mb-6">
            <View className="flex-row items-start">
              <Text className="text-xl mr-2">ℹ️</Text>
              <View className="flex-1">
                <Text className="text-sm text-blue-900 font-semibold mb-1">
                  Privacy & Verification
                </Text>
                <Text className="text-xs text-blue-800 leading-5">
                  Your tip will be reviewed by our verification team before being published. Your identity remains anonymous to other users.
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Submit Button */}
      <View className="px-6 pb-8 pt-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!selectedCategory || !title.trim() || !message.trim()}
          className={`rounded-xl py-4 ${
            selectedCategory && title.trim() && message.trim()
              ? 'bg-primary-600'
              : 'bg-gray-300'
          }`}
          activeOpacity={0.8}
        >
          <Text className="text-white text-center font-bold text-lg">
            Submit Tip
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
