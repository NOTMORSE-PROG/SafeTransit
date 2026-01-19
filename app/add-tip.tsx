import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Lightbulb,
  AlertTriangle,
  Construction,
  ShieldCheck,
  Bus,
  X,
  MapPin,
  Camera,
  CheckCircle,
  Info,
} from "lucide-react-native";

const CATEGORIES = [
  {
    id: "lighting",
    label: "Lighting",
    icon: "Lightbulb",
    description: "Well-lit or poorly lit areas",
  },
  {
    id: "harassment",
    label: "Harassment",
    icon: "AlertTriangle",
    description: "Areas with harassment reports",
  },
  {
    id: "construction",
    label: "Construction",
    icon: "Construction",
    description: "Construction zones or blocked paths",
  },
  {
    id: "safe_haven",
    label: "Safe Haven",
    icon: "ShieldCheck",
    description: "Safe spaces and help points",
  },
  {
    id: "transit",
    label: "Transit",
    icon: "Bus",
    description: "Transit tips and exit info",
  },
];

export default function AddTip() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [location, _setLocation] = useState("Current Location");
  const [hasPhoto, setHasPhoto] = useState(false);

  const handlePickImage = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
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
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      "Tip Submitted",
      "Your tip has been submitted for verification. Thank you for keeping our community safe!",
      [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ],
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
            accessible={true}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <X color="#ffffff" size={24} strokeWidth={2} />
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
          <Text className="text-sm font-semibold text-neutral-700 mb-2">
            Location
          </Text>
          <TouchableOpacity
            className="bg-neutral-100 rounded-xl px-4 py-3 mb-6"
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Change location"
            accessibilityRole="button"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <MapPin color="#6b7280" size={20} strokeWidth={2} />
                <Text className="text-base text-neutral-900 ml-2">
                  {location}
                </Text>
              </View>
              <Text className="text-primary-600 text-sm font-semibold">
                Change
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Category Selection */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Text className="text-sm font-semibold text-neutral-700 mb-3">
            Category <Text className="text-danger-600">*</Text>
          </Text>
          <View className="mb-6">
            {CATEGORIES.map((category) => {
              const IconComponent =
                category.icon === "Lightbulb"
                  ? Lightbulb
                  : category.icon === "AlertTriangle"
                    ? AlertTriangle
                    : category.icon === "Construction"
                      ? Construction
                      : category.icon === "ShieldCheck"
                        ? ShieldCheck
                        : Bus;
              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => {
                    setSelectedCategory(category.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={`mb-3 rounded-xl p-4 border-2 ${
                    selectedCategory === category.id
                      ? "border-primary-600 bg-primary-50"
                      : "border-neutral-200 bg-white"
                  }`}
                  activeOpacity={0.8}
                  accessible={true}
                  accessibilityLabel={`${category.label}: ${category.description}`}
                  accessibilityRole="button"
                >
                  <View className="flex-row items-center">
                    <View
                      className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
                        selectedCategory === category.id
                          ? "bg-primary-600"
                          : "bg-neutral-100"
                      }`}
                    >
                      <IconComponent
                        color={
                          selectedCategory === category.id
                            ? "#ffffff"
                            : "#6b7280"
                        }
                        size={24}
                        strokeWidth={2}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-neutral-900 mb-1">
                        {category.label}
                      </Text>
                      <Text className="text-sm text-neutral-600">
                        {category.description}
                      </Text>
                    </View>
                    {selectedCategory === category.id && (
                      <View className="bg-primary-600 rounded-full p-1.5">
                        <CheckCircle
                          color="#ffffff"
                          size={16}
                          strokeWidth={2.5}
                        />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Text className="text-sm font-semibold text-neutral-700 mb-2">
            Title <Text className="text-danger-600">*</Text>
          </Text>
          <TextInput
            placeholder="e.g., Well-lit MRT exit"
            value={title}
            onChangeText={setTitle}
            className="bg-neutral-100 rounded-xl px-4 py-3 text-base text-neutral-900 mb-6"
            placeholderTextColor="#9CA3AF"
            maxLength={50}
          />
        </Animated.View>

        {/* Message */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Text className="text-sm font-semibold text-neutral-700 mb-2">
            Message <Text className="text-danger-600">*</Text>
          </Text>
          <TextInput
            placeholder="Share details that could help others stay safe..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            className="bg-neutral-100 rounded-xl px-4 py-3 text-base text-neutral-900 mb-6"
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
            maxLength={300}
          />
          <Text className="text-xs text-neutral-500 text-right -mt-4 mb-6">
            {message.length}/300
          </Text>
        </Animated.View>

        {/* Photo Upload */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <Text className="text-sm font-semibold text-neutral-700 mb-2">
            Photo (Optional)
          </Text>
          <TouchableOpacity
            onPress={handlePickImage}
            className={`rounded-xl px-4 py-8 mb-6 border-2 border-dashed ${
              hasPhoto
                ? "border-success-500 bg-success-50"
                : "border-neutral-300 bg-neutral-50"
            }`}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel={
              hasPhoto ? "Photo added, tap to change" : "Add photo"
            }
            accessibilityRole="button"
          >
            <View className="items-center">
              <View className="mb-3">
                {hasPhoto ? (
                  <CheckCircle color="#22c55e" size={40} strokeWidth={2} />
                ) : (
                  <Camera color="#6b7280" size={40} strokeWidth={2} />
                )}
              </View>
              <Text className="text-base font-semibold text-neutral-900 mb-1">
                {hasPhoto ? "Photo Added" : "Add Photo"}
              </Text>
              <Text className="text-sm text-neutral-600">
                {hasPhoto
                  ? "Tap to change"
                  : "Optional but helpful for verification"}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Privacy Notice */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)}>
          <View className="bg-primary-50 rounded-xl p-4 mb-6">
            <View className="flex-row items-start">
              <Info color="#1d4ed8" size={20} strokeWidth={2} />
              <View className="flex-1 ml-3">
                <Text className="text-sm text-primary-900 font-semibold mb-1">
                  Privacy & Verification
                </Text>
                <Text className="text-xs text-primary-800 leading-5">
                  Your tip will be reviewed by our verification team before
                  being published. Your identity remains anonymous to other
                  users.
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Submit Button */}
      <View
        className="px-6 pt-4 bg-white border-t border-neutral-100"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!selectedCategory || !title.trim() || !message.trim()}
          className={`rounded-xl py-4 ${
            selectedCategory && title.trim() && message.trim()
              ? "bg-primary-600"
              : "bg-neutral-300"
          }`}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Submit community tip"
          accessibilityRole="button"
        >
          <Text className="text-white text-center font-bold text-lg">
            Submit Tip
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
