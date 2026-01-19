import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  FadeInDown,
  SlideInDown,
  SlideOutDown,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import {
  UserCircle,
  Phone,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  Trash2,
  X,
  Chrome,
  Pencil,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import { useAuth } from "../../contexts/AuthContext";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { apiFetch } from "../../utils/api";

export default function Profile() {
  const router = useRouter();
  const { user, token, refreshUser } = useAuth();
  const { linkGoogleAccount, isLoading: googleLinking } = useGoogleAuth();

  const [backgroundAlerts, setBackgroundAlerts] = useState(true);
  const [vibrationAlerts, setVibrationAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [contactCount, setContactCount] = useState(0);
  const [showNameModal, setShowNameModal] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // Use profile image from user context (synced with database)
  const profileImage = user?.profileImageUrl || null;
  const displayName = user?.fullName || "Traveler";

  const loadContactCount = useCallback(async () => {
    try {
      const response = await apiFetch("/api/contacts/emergency", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setContactCount(data.contacts?.length || 0);
      }
    } catch (error) {
      console.error("Failed to load contact count", error);
    }
  }, [token]);

  // Reload contact count when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadContactCount();
    }, [loadContactCount]),
  );

  // Upload image to UploadThing via backend API
  const uploadImage = async (file: {
    uri: string;
    name: string;
    type: string;
  }) => {
    if (!token) {
      Alert.alert("Error", "Please log in to upload images");
      return;
    }

    setIsUploading(true);
    setShowActionSheet(false);

    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: "base64",
      });

      // Upload to backend
      const uploadResponse = await apiFetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          base64,
          fileName: file.name,
          mimeType: file.type,
        }),
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Upload failed");
      }

      const uploadResult = await uploadResponse.json();
      console.log("Upload successful:", uploadResult.url);

      // Update profile with new image URL (backend will auto-delete old image)
      const updateResponse = await apiFetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profileImageUrl: uploadResult.url,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update profile");
      }

      // Refresh user data to show new image
      await refreshUser();
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to upload image",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const pickImage = async (useCamera: boolean = false) => {
    try {
      let result;
      if (useCamera) {
        await ImagePicker.requestCameraPermissionsAsync();
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled) {
        const selectedImage = result.assets[0];
        const file = {
          uri: selectedImage.uri,
          name: selectedImage.fileName || `profile_${Date.now()}.jpg`,
          type: selectedImage.mimeType || "image/jpeg",
        };

        await uploadImage(file);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
      console.error(error);
    }
  };

  const handleRemovePhoto = async () => {
    if (!token) return;

    setShowActionSheet(false);
    setIsUploading(true);

    try {
      // Call backend to remove photo (will delete from UploadThing)
      const response = await apiFetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          removePhoto: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove photo");
      }

      // Refresh user data
      await refreshUser();
    } catch (error) {
      console.error("Failed to remove profile image", error);
      Alert.alert("Error", "Failed to remove photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditPhoto = () => {
    setShowActionSheet(true);
  };

  const handleEditName = () => {
    setEditingName(displayName);
    setShowNameModal(true);
  };

  const handleSaveName = async () => {
    if (!token || !editingName.trim()) return;

    if (editingName.trim().length < 2) {
      Alert.alert("Error", "Name must be at least 2 characters");
      return;
    }

    setIsSavingName(true);

    try {
      const response = await apiFetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: editingName.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update name");
      }

      // Refresh user data
      await refreshUser();
      setShowNameModal(false);
    } catch (error) {
      console.error("Failed to update name:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update name",
      );
    } finally {
      setIsSavingName(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("hasOnboarded");
          router.replace("/onboarding/welcome");
        },
      },
    ]);
  };

  const handleLinkGoogle = async () => {
    if (!token) return;

    setLinkingGoogle(true);
    const result = await linkGoogleAccount(token);

    if (result.success) {
      Alert.alert("Success", "Google account linked successfully!");
      await refreshUser();
    } else {
      Alert.alert("Error", result.error || "Failed to link Google account");
    }
    setLinkingGoogle(false);
  };

  return (
    <View className="flex-1 bg-neutral-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-primary-600 pt-14 pb-8 px-6">
          <View className="items-center">
            <TouchableOpacity
              onPress={handleEditPhoto}
              className="relative mb-4"
              activeOpacity={0.8}
            >
              <View className="w-24 h-24 bg-white rounded-full items-center justify-center overflow-hidden">
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={{ width: 96, height: 96 }}
                    contentFit="cover"
                    cachePolicy="none"
                  />
                ) : (
                  <UserCircle color="#2563eb" size={64} strokeWidth={1.5} />
                )}
                {isUploading && (
                  <View className="absolute inset-0 bg-black/40 items-center justify-center">
                    <ActivityIndicator color="#ffffff" size="large" />
                  </View>
                )}
              </View>
              <View className="absolute bottom-0 right-0 bg-neutral-900 rounded-full p-2 border-2 border-primary-600">
                <Camera color="#ffffff" size={14} strokeWidth={2} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEditName}
              className="flex-row items-center mb-1"
              activeOpacity={0.7}
            >
              <Text className="text-white text-2xl font-bold mr-2">
                {displayName}
              </Text>
              <Pencil color="#ffffff" size={16} strokeWidth={2} />
            </TouchableOpacity>
            <Text className="text-white/80 text-sm">Protected since today</Text>
          </View>
        </View>

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(600)}
          className="mx-6 -mt-6 bg-white rounded-2xl p-4 shadow-lg mb-6"
        >
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-neutral-900">0</Text>
              <Text className="text-xs text-neutral-500 mt-1">Trips</Text>
            </View>
            <View className="w-px bg-neutral-200" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-neutral-900">0</Text>
              <Text className="text-xs text-neutral-500 mt-1">Tips Added</Text>
            </View>
            <View className="w-px bg-neutral-200" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-neutral-900">0</Text>
              <Text className="text-xs text-neutral-500 mt-1">Alerts</Text>
            </View>
          </View>
        </Animated.View>

        <View className="px-6">
          {/* Safety Settings */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Text className="text-lg font-bold text-neutral-900 mb-3">
              Safety Settings
            </Text>

            <View className="bg-white rounded-2xl overflow-hidden mb-6 shadow-sm">
              <View className="px-4 py-4 border-b border-neutral-100">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-neutral-900 mb-1">
                      Background Alerts
                    </Text>
                    <Text className="text-sm text-neutral-500">
                      Get alerts when entering danger zones
                    </Text>
                  </View>
                  <Switch
                    value={backgroundAlerts}
                    onValueChange={setBackgroundAlerts}
                    trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                    thumbColor={backgroundAlerts ? "#2563eb" : "#f3f4f6"}
                    accessible={true}
                    accessibilityLabel="Background alerts toggle"
                    accessibilityRole="switch"
                  />
                </View>
              </View>

              <View className="px-4 py-4 border-b border-neutral-100">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-neutral-900 mb-1">
                      Vibration Alerts
                    </Text>
                    <Text className="text-sm text-neutral-500">
                      Phone vibrates in danger zones
                    </Text>
                  </View>
                  <Switch
                    value={vibrationAlerts}
                    onValueChange={setVibrationAlerts}
                    trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                    thumbColor={vibrationAlerts ? "#2563eb" : "#f3f4f6"}
                    accessible={true}
                    accessibilityLabel="Vibration alerts toggle"
                    accessibilityRole="switch"
                  />
                </View>
              </View>

              <View className="px-4 py-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-neutral-900 mb-1">
                      Sound Alerts
                    </Text>
                    <Text className="text-sm text-neutral-500">
                      Audible notifications (not recommended)
                    </Text>
                  </View>
                  <Switch
                    value={soundAlerts}
                    onValueChange={setSoundAlerts}
                    trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                    thumbColor={soundAlerts ? "#2563eb" : "#f3f4f6"}
                    accessible={true}
                    accessibilityLabel="Sound alerts toggle"
                    accessibilityRole="switch"
                  />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Emergency Contacts */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <Text className="text-lg font-bold text-neutral-900 mb-3">
              Emergency Contacts
            </Text>

            <TouchableOpacity
              className="bg-white rounded-2xl p-4 mb-6 shadow-sm"
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel="Manage emergency contacts"
              accessibilityRole="button"
              onPress={() => router.push("/emergency-contacts" as never)}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mr-3">
                    <Phone color="#2563eb" size={24} strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-neutral-900">
                      Manage Contacts
                    </Text>
                    <Text className="text-sm text-neutral-500">
                      {contactCount} contact{contactCount !== 1 ? "s" : ""}{" "}
                      added
                    </Text>
                  </View>
                </View>
                <ChevronRight color="#9ca3af" size={20} strokeWidth={2} />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Linked Accounts */}
          <Animated.View entering={FadeInDown.delay(350).duration(600)}>
            <Text className="text-lg font-bold text-neutral-900 mb-3">
              Linked Accounts
            </Text>

            <View className="bg-white rounded-2xl overflow-hidden mb-6 shadow-sm">
              <View className="px-4 py-4 border-b border-neutral-100">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Chrome size={18} color="#2563eb" />
                      <Text className="text-base font-semibold text-neutral-900 ml-2">
                        Google Account
                      </Text>
                    </View>
                    <Text className="text-sm text-neutral-500">
                      {user?.hasGoogleLinked
                        ? "Connected - You can sign in with Google"
                        : "Not connected"}
                    </Text>
                  </View>
                  {!user?.hasGoogleLinked && (
                    <TouchableOpacity
                      onPress={handleLinkGoogle}
                      disabled={linkingGoogle || googleLinking}
                      className="bg-primary-600 px-4 py-2 rounded-xl"
                      activeOpacity={0.7}
                    >
                      {linkingGoogle || googleLinking ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text className="text-white font-bold text-sm">
                          Link
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                  {user?.hasGoogleLinked && (
                    <View className="bg-green-100 px-3 py-1 rounded-full">
                      <Text className="text-green-700 font-bold text-xs">
                        Linked
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* About */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <Text className="text-lg font-bold text-neutral-900 mb-3">
              About
            </Text>

            <View className="bg-white rounded-2xl overflow-hidden mb-6 shadow-sm">
              <TouchableOpacity
                className="px-4 py-4 border-b border-neutral-100"
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel="How it works"
                accessibilityRole="button"
                onPress={() => router.push("/how-it-works")}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base text-neutral-900">
                    How It Works
                  </Text>
                  <ChevronRight color="#9ca3af" size={20} strokeWidth={2} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="px-4 py-4 border-b border-neutral-100"
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel="Privacy policy"
                accessibilityRole="button"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base text-neutral-900">
                    Privacy Policy
                  </Text>
                  <ChevronRight color="#9ca3af" size={20} strokeWidth={2} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="px-4 py-4"
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel="Terms of service"
                accessibilityRole="button"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base text-neutral-900">
                    Terms of Service
                  </Text>
                  <ChevronRight color="#9ca3af" size={20} strokeWidth={2} />
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Logout */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)}>
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-danger-50 border-2 border-danger-200 rounded-2xl p-4 mb-8"
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel="Logout"
              accessibilityRole="button"
            >
              <Text className="text-danger-600 text-center font-bold text-base">
                Logout
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View className="items-center mb-8">
            <Text className="text-neutral-400 text-xs">SafeTransit v1.0.1</Text>
            <Text className="text-neutral-400 text-xs mt-1">
              Made with ❤️ by TIP Manila
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Custom Action Sheet Modal */}
      <Modal
        visible={showActionSheet}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <View className="flex-1 justify-end">
          {/* Backdrop */}
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            className="absolute inset-0 bg-black/50"
          >
            <Pressable
              className="flex-1"
              onPress={() => setShowActionSheet(false)}
            />
          </Animated.View>

          {/* Sheet */}
          <Animated.View
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(300)}
            className="bg-white rounded-t-3xl p-6 pb-10"
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-neutral-900">
                Profile Photo
              </Text>
              <TouchableOpacity
                onPress={() => setShowActionSheet(false)}
                className="bg-neutral-100 p-2 rounded-full"
              >
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <TouchableOpacity
                onPress={() => pickImage(true)}
                className="flex-row items-center p-4 bg-neutral-50 rounded-2xl active:bg-neutral-100"
              >
                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
                  <Camera size={20} color="#2563eb" />
                </View>
                <Text className="text-base font-semibold text-neutral-900">
                  Take Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => pickImage(false)}
                className="flex-row items-center p-4 bg-neutral-50 rounded-2xl active:bg-neutral-100"
              >
                <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-4">
                  <ImageIcon size={20} color="#9333ea" />
                </View>
                <Text className="text-base font-semibold text-neutral-900">
                  Choose from Library
                </Text>
              </TouchableOpacity>

              {profileImage && (
                <TouchableOpacity
                  onPress={handleRemovePhoto}
                  className="flex-row items-center p-4 bg-red-50 rounded-2xl active:bg-red-100"
                >
                  <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-4">
                    <Trash2 size={20} color="#dc2626" />
                  </View>
                  <Text className="text-base font-semibold text-red-600">
                    Remove Photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Edit Name Modal */}
      <Modal
        visible={showNameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <Animated.View
            entering={FadeIn.duration(200)}
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
          >
            <Text className="text-xl font-bold text-neutral-900 mb-4">
              Edit Name
            </Text>

            <TextInput
              value={editingName}
              onChangeText={setEditingName}
              placeholder="Enter your name"
              className="border border-neutral-200 rounded-xl px-4 py-3 text-base text-neutral-900 mb-4"
              autoFocus
              placeholderTextColor="#9ca3af"
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowNameModal(false)}
                className="flex-1 bg-neutral-100 py-3 rounded-xl"
                activeOpacity={0.7}
              >
                <Text className="text-neutral-700 text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveName}
                disabled={
                  isSavingName ||
                  !editingName.trim() ||
                  editingName.trim() === displayName
                }
                className={`flex-1 py-3 rounded-xl ${isSavingName || !editingName.trim() || editingName.trim() === displayName ? "bg-primary-300" : "bg-primary-600"}`}
                activeOpacity={0.7}
              >
                {isSavingName ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text className="text-white text-center font-semibold">
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
