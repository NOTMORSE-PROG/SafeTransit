// Create Post Screen
// Form for creating a new forum post

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, MapPin, ImagePlus, X, Check } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/contexts/AuthContext";
import { createPost, type PostFlair } from "@/services/forumService";
import { FLAIR_CONFIG } from "@/services/types/forum";
import { uploadForumImages } from "@/services/uploadthing";

const FLAIRS: PostFlair[] = [
  "general",
  "routes",
  "questions",
  "experiences",
  "tips_advice",
];

export default function CreatePost() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedFlair, setSelectedFlair] = useState<PostFlair>("general");
  const [locationTag, setLocationTag] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    title.trim().length > 0 && body.trim().length > 0 && !isSubmitting;

  const pickImage = async () => {
    if (photoUris.length >= 5) {
      Alert.alert("Limit reached", "You can upload up to 5 photos per post.");
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant camera roll permissions to upload photos.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUris([...photoUris, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUris(photoUris.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!canSubmit || !token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload all photos if available (up to 5)
      let photoUrls: string[] = [];
      if (photoUris.length > 0) {
        const files = photoUris.map((uri, index) => ({
          uri,
          name: `forum-${Date.now()}-${index}.jpg`,
          type: "image/jpeg",
        }));

        const uploadResult = await uploadForumImages(files, token);

        if (uploadResult.success && uploadResult.urls.length > 0) {
          photoUrls = uploadResult.urls;
        } else if (!uploadResult.success) {
          console.warn("Photo upload failed:", uploadResult.error);
          // Continue without photos
        }
      }

      await createPost(
        {
          title: title.trim(),
          body: body.trim(),
          flair: selectedFlair,
          location_tag: locationTag.trim() || undefined,
          photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
        },
        token,
      );

      router.back();
    } catch (err) {
      console.error("Failed to create post:", err);
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || !token) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-xl font-bold text-neutral-900 mb-2">
          Sign In Required
        </Text>
        <Text className="text-neutral-600 text-center mb-6">
          You need to be signed in to create a post.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/auth/login")}
          className="bg-primary-600 px-8 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 pb-4 border-b border-neutral-100 bg-white"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2"
          accessibilityLabel="Go back"
        >
          <ArrowLeft color="#374151" size={24} strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-neutral-900">New Post</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit}
          className={`px-4 py-2 rounded-full ${canSubmit ? "bg-primary-600" : "bg-neutral-200"}`}
          accessibilityLabel="Post"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              className={`font-semibold ${canSubmit ? "text-white" : "text-neutral-400"}`}
            >
              Post
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Error message */}
        {error && (
          <View className="bg-danger-50 border border-danger-200 rounded-xl p-3 mb-4">
            <Text className="text-danger-700 text-sm">{error}</Text>
          </View>
        )}

        {/* Flair Selection */}
        <Text className="text-sm font-semibold text-neutral-700 mb-2">
          Select a Flair *
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row mb-6 -mx-6 px-6"
        >
          {FLAIRS.map((flair) => (
            <TouchableOpacity
              key={flair}
              onPress={() => setSelectedFlair(flair)}
              className={`flex-row items-center mr-2 px-3 py-2 rounded-full border-2 ${
                selectedFlair === flair
                  ? "border-primary-600 bg-primary-50"
                  : "border-neutral-200 bg-neutral-50"
              }`}
              activeOpacity={0.7}
            >
              <Text className="mr-1">{FLAIR_CONFIG[flair].emoji}</Text>
              <Text
                className={`text-sm font-medium ${
                  selectedFlair === flair
                    ? "text-primary-700"
                    : "text-neutral-700"
                }`}
              >
                {FLAIR_CONFIG[flair].label}
              </Text>
              {selectedFlair === flair && (
                <Check
                  color="#2563eb"
                  size={16}
                  strokeWidth={2}
                  className="ml-1"
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Title */}
        <Text className="text-sm font-semibold text-neutral-700 mb-2">
          Title *{" "}
          <Text className="font-normal text-neutral-400">
            ({title.length}/100)
          </Text>
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Give your post a title..."
          placeholderTextColor="#9ca3af"
          className="bg-neutral-50 rounded-xl px-4 py-3 text-base text-neutral-900 mb-6"
          maxLength={100}
        />

        {/* Body */}
        <Text className="text-sm font-semibold text-neutral-700 mb-2">
          Body *{" "}
          <Text className="font-normal text-neutral-400">
            ({body.length}/2000)
          </Text>
        </Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Share your thoughts, experiences, or questions..."
          placeholderTextColor="#9ca3af"
          className="bg-neutral-50 rounded-xl px-4 py-3 text-base text-neutral-900 mb-6"
          maxLength={2000}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          style={{ minHeight: 150 }}
        />

        {/* Location Tag (Optional) */}
        <Text className="text-sm font-semibold text-neutral-700 mb-2">
          Location{" "}
          <Text className="font-normal text-neutral-400">(optional)</Text>
        </Text>
        <View className="flex-row items-center bg-neutral-50 rounded-xl px-4 py-3 mb-6">
          <MapPin color="#6b7280" size={20} strokeWidth={2} />
          <TextInput
            value={locationTag}
            onChangeText={setLocationTag}
            placeholder="Add a location tag..."
            placeholderTextColor="#9ca3af"
            className="flex-1 text-base text-neutral-900 ml-2"
            maxLength={255}
          />
        </View>

        {/* Photos (Optional) */}
        <Text className="text-sm font-semibold text-neutral-700 mb-2">
          Photos{" "}
          <Text className="font-normal text-neutral-400">
            (optional, max 5)
          </Text>
        </Text>
        {photoUris.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4 -mx-6 px-6"
          >
            {photoUris.map((uri, index) => (
              <View key={index} className="relative mr-3">
                <Image
                  source={{ uri }}
                  className="w-32 h-32 rounded-xl bg-neutral-200"
                  resizeMode="contain"
                />
                <TouchableOpacity
                  onPress={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-black/70 rounded-full p-1.5"
                >
                  <X color="#fff" size={16} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
        {photoUris.length < 5 && (
          <TouchableOpacity
            onPress={pickImage}
            className="flex-row items-center justify-center bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-xl py-8 mb-6"
            activeOpacity={0.7}
          >
            <ImagePlus color="#6b7280" size={24} strokeWidth={2} />
            <Text className="text-neutral-600 font-medium ml-2">
              {photoUris.length === 0
                ? "Add photos"
                : `Add more (${photoUris.length}/5)`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Bottom padding */}
        <View className="h-10" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
