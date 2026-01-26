import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
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
import LocationPicker from "../components/map/LocationPicker";
import { submitTip, TipCategory, TimeRelevance } from "../services/tipsService";
import { colors } from "../constants/theme";

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

const TIME_OPTIONS: { value: TimeRelevance; label: string; emoji: string }[] = [
  { value: "morning", label: "Morning", emoji: "🌅" },
  { value: "afternoon", label: "Afternoon", emoji: "☀️" },
  { value: "evening", label: "Evening", emoji: "🌆" },
  { value: "night", label: "Night", emoji: "🌙" },
  { value: "24/7", label: "24/7", emoji: "⏰" },
];

export default function AddTip() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<TipCategory | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [locationName, setLocationName] = useState("Getting your location...");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [timeRelevance, setTimeRelevance] = useState<TimeRelevance>("24/7");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Get user's current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName('Tap to select location');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude: lat, longitude: lon } = location.coords;
      setLatitude(lat);
      setLongitude(lon);

      // Get place name using reverse geocoding
      try {
        const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (results && results.length > 0) {
          const place = results[0];
          const parts = [
            place.street,
            place.district,
            place.city || place.subregion,
          ].filter(Boolean);
          setLocationName(parts.length > 0 ? parts.join(', ') : `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        } else {
          setLocationName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        }
      } catch (geoError) {
        console.error('Error reverse geocoding:', geoError);
        setLocationName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationName('Tap to select location');
    }
  };

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
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleLocationSelect = (loc: { latitude: number; longitude: number; locationName: string }) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setLocationName(loc.locationName);
    setShowLocationPicker(false);
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !title.trim() || !message.trim() || !latitude || !longitude) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Missing Information", "Please fill in all required fields and select a location.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Submit tip to API (auto-approved)
      await submitTip({
        title: title.trim(),
        message: message.trim(),
        category: selectedCategory,
        latitude,
        longitude,
        location_name: locationName,
        time_relevance: timeRelevance,
        photo_url: photoUri || undefined,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccessModal(true);
    } catch (error: unknown) {
      console.error('Error submitting tip:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      let errorMessage = "There was an error submitting your tip. Please try again.";
      const err = error as { code?: string };
      if (err.code === 'NETWORK_ERROR') {
        errorMessage = "Unable to connect. Please check your internet connection and try again.";
      } else if (err.code === 'AUTH_ERROR') {
        errorMessage = "Authentication failed. Please sign in again.";
      }

      Alert.alert("Submission Failed", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsSubmitting(false);
    }
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
            Location <Text className="text-danger-600">*</Text>
          </Text>
          <TouchableOpacity
            className="bg-neutral-100 rounded-xl px-4 py-3 mb-6"
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Change location"
            accessibilityRole="button"
            onPress={() => setShowLocationPicker(true)}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <MapPin color={colors.neutral[500]} size={20} strokeWidth={2} />
                <Text className="text-base text-neutral-900 ml-2 flex-1" numberOfLines={1}>
                  {locationName}
                </Text>
              </View>
              <Text className="text-primary-600 text-sm font-semibold">
                {latitude && longitude ? 'Change' : 'Select'}
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
                    setSelectedCategory(category.id as TipCategory);
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
                            : colors.neutral[500]
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

        {/* Time Relevance */}
        <Animated.View entering={FadeInDown.delay(450).duration(600)}>
          <Text className="text-sm font-semibold text-neutral-700 mb-3">
            When is this relevant?
          </Text>
          <View className="flex-row flex-wrap gap-3 mb-6">
            {TIME_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  setTimeRelevance(option.value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className={`px-4 py-3 rounded-xl border-2 ${
                  timeRelevance === option.value
                    ? "border-primary-600 bg-primary-50"
                    : "border-neutral-200 bg-white"
                }`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center gap-2">
                  <Text className="text-base">{option.emoji}</Text>
                  <Text
                    className={`text-sm font-semibold ${
                      timeRelevance === option.value
                        ? "text-primary-700"
                        : "text-neutral-700"
                    }`}
                  >
                    {option.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
                  <CheckCircle color={colors.safe[500]} size={40} strokeWidth={2} />
                ) : (
                  <Camera color={colors.neutral[500]} size={40} strokeWidth={2} />
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
              <Info color={colors.primary[700]} size={20} strokeWidth={2} />
              <View className="flex-1 ml-3">
                <Text className="text-sm text-primary-900 font-semibold mb-1">
                  Instant Publishing
                </Text>
                <Text className="text-xs text-primary-800 leading-5">
                  Your tip will be published immediately and visible to the community.
                  Your identity remains anonymous to other users.
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
          disabled={!selectedCategory || !title.trim() || !message.trim() || !latitude || !longitude || isSubmitting}
          className={`rounded-xl py-4 ${
            selectedCategory && title.trim() && message.trim() && latitude && longitude && !isSubmitting
              ? "bg-primary-600"
              : "bg-neutral-300"
          }`}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Submit community tip"
          accessibilityRole="button"
        >
          {isSubmitting ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white font-bold text-lg ml-3">
                Publishing...
              </Text>
            </View>
          ) : (
            <Text className="text-white text-center font-bold text-lg">
              Submit Tip
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <LocationPicker
          initialLocation={
            latitude && longitude
              ? { latitude, longitude }
              : undefined
          }
          onLocationSelect={handleLocationSelect}
          onCancel={() => setShowLocationPicker(false)}
        />
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          router.back();
        }}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            className="bg-white rounded-3xl p-8 items-center max-w-sm w-full"
          >
            <View className="w-20 h-20 bg-safe-100 rounded-full items-center justify-center mb-6">
              <CheckCircle color={colors.safe[500]} size={48} strokeWidth={2.5} />
            </View>

            <Text className="text-2xl font-bold text-neutral-900 mb-3 text-center">
              Tip Published!
            </Text>

            <Text className="text-base text-neutral-600 text-center mb-8 leading-6">
              Your tip has been published and is now visible to the community. Thank you for keeping others safe!
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
              className="bg-primary-600 rounded-xl py-4 px-8 w-full"
              activeOpacity={0.8}
            >
              <Text className="text-white text-center font-bold text-base">
                Done
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
