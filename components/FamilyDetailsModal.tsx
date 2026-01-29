import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import {
  X,
  UserCircle,
  Settings,
  UserMinus,
  RefreshCw,
  Trash2,
  LogOut,
  Crown,
  Clock,
} from "lucide-react-native";
import {
  familyService,
  Family,
  FamilyMemberDetail,
} from "../services/familyService";

interface FamilyDetailsModalProps {
  family: Family | null;
  isVisible: boolean;
  onClose: () => void;
  onFamilyUpdated: () => void;
}

const FamilyDetailsModal: React.FC<FamilyDetailsModalProps> = ({
  family,
  isVisible,
  onClose,
  onFamilyUpdated,
}) => {
  const [members, setMembers] = useState<FamilyMemberDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showManageModal, setShowManageModal] = useState(false);

  const loadFamilyDetails = useCallback(
    async (silent = false) => {
      if (!family) return;

      try {
        if (!silent) {
          setIsLoading(true);
        }
        const details = await familyService.getFamilyDetails(family.id);
        setMembers(details.members);
      } catch (error) {
        console.error("Failed to load family details:", error);
        // Don't clear members on error - keep showing current data
        if (!silent) {
          Alert.alert("Error", "Failed to load family details");
        }
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [family],
  );

  useEffect(() => {
    if (isVisible && family) {
      loadFamilyDetails();
    }
  }, [isVisible, family, loadFamilyDetails]);

  // Auto-refresh members every 30 seconds when modal is open
  useEffect(() => {
    if (!isVisible || !family) return;

    const interval = setInterval(() => {
      loadFamilyDetails(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [isVisible, family, loadFamilyDetails]);

  const handleRemoveMember = (member: FamilyMemberDetail) => {
    if (!family) return;

    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${member.full_name} from your family?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await familyService.removeMember(family.id, member.user_id);
              Alert.alert("Success", "Member removed successfully");
              await loadFamilyDetails();
              onFamilyUpdated();
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Failed to remove member",
              );
            }
          },
        },
      ],
    );
  };

  const handleRegenerateInviteCode = () => {
    if (!family) return;

    Alert.alert(
      "Regenerate Invite Code",
      "This will invalidate the old invite link. Family members will need the new code to join.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Regenerate",
          style: "destructive",
          onPress: async () => {
            try {
              await familyService.regenerateInviteCode(family.id);
              Alert.alert("Success", "Invite code regenerated successfully");
              onFamilyUpdated();
              setShowManageModal(false);
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to regenerate invite code",
              );
            }
          },
        },
      ],
    );
  };

  const handleDeleteFamily = () => {
    if (!family) return;

    Alert.alert(
      "Delete Family",
      "Are you sure you want to delete this family? This will remove all members and stop location sharing for everyone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await familyService.deleteFamily(family.id);
              Alert.alert("Success", "Family deleted successfully");
              onFamilyUpdated();
              setShowManageModal(false);
              onClose();
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Failed to delete family",
              );
            }
          },
        },
      ],
    );
  };

  const handleLeaveFamily = () => {
    if (!family) return;

    Alert.alert(
      "Leave Family",
      "Are you sure you want to leave this family? Your location will stop being shared.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await familyService.leaveFamily(family.id);
              Alert.alert("Success", "You have left the family");
              onFamilyUpdated();
              onClose();
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Failed to leave family",
              );
            }
          },
        },
      ],
    );
  };

  const getTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const joinedTime = new Date(timestamp).getTime();
    const diff = now - joinedTime;

    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  if (!family) return null;

  return (
    <>
      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        onRequestClose={onClose}
      >
        <Pressable className="flex-1 bg-black/50" onPress={onClose}>
          <Animated.View
            entering={SlideInDown.duration(400)}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
            style={{ maxHeight: "85%" }}
          >
            <Pressable>
              {/* Handle Bar */}
              <View className="w-12 h-1 bg-gray-300 rounded-full self-center mt-3 mb-4" />

              {/* Header */}
              <View className="flex-row items-center justify-between px-6 mb-4">
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-gray-900">
                    {family.name}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {members.length} member{members.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <View className="flex-row space-x-2">
                  {family.userRole === "creator" && (
                    <TouchableOpacity
                      onPress={() => setShowManageModal(true)}
                      className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                    >
                      <Settings size={20} color="#6b7280" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={onClose}
                    className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                  >
                    <X size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Members List */}
              <ScrollView className="px-6 pb-8">
                {isLoading ? (
                  <View className="py-12 items-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                  </View>
                ) : (
                  <View className="space-y-3">
                    {members.map((member) => (
                      <View
                        key={member.user_id}
                        className="bg-gray-50 rounded-2xl p-4"
                      >
                        <View className="flex-row items-center">
                          <View className="w-12 h-12 rounded-full overflow-hidden mr-3">
                            {member.profile_image_url ? (
                              <Image
                                source={{ uri: member.profile_image_url }}
                                className="w-full h-full"
                                contentFit="cover"
                              />
                            ) : (
                              <View className="w-full h-full bg-gray-300 items-center justify-center">
                                <UserCircle size={28} color="#6b7280" />
                              </View>
                            )}
                          </View>

                          <View className="flex-1">
                            <View className="flex-row items-center">
                              <Text className="text-base font-semibold text-gray-900">
                                {member.full_name}
                              </Text>
                              {member.role === "creator" && (
                                <View className="ml-2 bg-amber-100 px-2 py-0.5 rounded-full flex-row items-center">
                                  <Crown size={12} color="#d97706" />
                                  <Text className="text-xs font-bold text-amber-700 ml-1">
                                    Creator
                                  </Text>
                                </View>
                              )}
                            </View>
                            <View className="flex-row items-center mt-1">
                              <Clock size={12} color="#9ca3af" />
                              <Text className="text-xs text-gray-500 ml-1">
                                Joined {getTimeAgo(member.joined_at)}
                              </Text>
                            </View>
                          </View>

                          {family.userRole === "creator" &&
                            member.role !== "creator" && (
                              <TouchableOpacity
                                onPress={() => handleRemoveMember(member)}
                                className="ml-2 p-2"
                              >
                                <UserMinus size={20} color="#ef4444" />
                              </TouchableOpacity>
                            )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Leave Family Button (for non-creators) */}
                {family.userRole === "member" && (
                  <TouchableOpacity
                    onPress={handleLeaveFamily}
                    className="mt-6 bg-red-50 border-2 border-red-200 rounded-2xl p-4"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center justify-center">
                      <LogOut size={20} color="#ef4444" />
                      <Text className="ml-2 text-red-600 font-bold text-base">
                        Leave Family
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Manage Family Modal (Creator Only) */}
      <Modal
        visible={showManageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowManageModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <Animated.View
            entering={FadeIn.duration(200)}
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
          >
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Manage Family
            </Text>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={handleRegenerateInviteCode}
                className="flex-row items-center p-4 bg-blue-50 rounded-xl"
                activeOpacity={0.7}
              >
                <RefreshCw size={20} color="#2563eb" />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    Regenerate Invite Code
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Get a new invite link
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteFamily}
                className="flex-row items-center p-4 bg-red-50 rounded-xl"
                activeOpacity={0.7}
              >
                <Trash2 size={20} color="#ef4444" />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold text-red-600">
                    Delete Family
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Remove all members
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setShowManageModal(false)}
              className="mt-4 bg-gray-100 py-3 rounded-xl"
              activeOpacity={0.7}
            >
              <Text className="text-gray-700 text-center font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

export default FamilyDetailsModal;
