import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import {
  ArrowLeft,
  Copy,
  Share2,
  Clock,
  UserMinus,
  Trash2,
} from "lucide-react-native";
import { Image } from "expo-image";
import { useAuth } from "../contexts/AuthContext";
import { familyService, Family, FamilyMemberDetail } from "../services/familyService";

export default function FamilyPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMemberDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFamily = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      familyService.setToken(token);
      const families = await familyService.getUserFamilies();
      
      if (families.length > 0) {
        setFamily(families[0]);
        const familyMembers = await familyService.getFamilyMembers(families[0].id);
        setMembers(familyMembers);
      }
    } catch (error) {
      console.error("Failed to load family", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadFamily();
    }, [loadFamily])
  );

  const handleCopyInviteCode = async () => {
    if (!family) return;

    const link = familyService.getShareableLink(family.invite_code);
    try {
      await Clipboard.setStringAsync(link);
      Alert.alert("Copied!", "Invite link copied to clipboard");
    } catch (error) {
      console.error("Failed to copy:", error);
      Alert.alert("Invite Link", link);
    }
  };

  const handleShareInviteLink = async () => {
    if (!family) return;

    const link = familyService.getShareableLink(family.invite_code);
    try {
      await Share.share({
        message: `Join my family safety network on SafeTransit!\n\nFamily: ${family.name}\nInvite code: ${family.invite_code}\n\nLink: ${link}`,
        title: "Join My Family Network",
      });
    } catch (error) {
      console.error("Failed to share:", error);
      Alert.alert("Invite Link", link);
    }
  };

  const handleRemoveMember = (member: FamilyMemberDetail) => {
    if (family?.userRole !== "creator") {
      Alert.alert("Error", "Only the family creator can remove members");
      return;
    }

    Alert.alert(
      "Remove Member",
      `Remove ${member.full_name} from the family?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            // TODO: Implement actual removal
            Alert.alert("Success", "Member removed");
          },
        },
      ]
    );
  };

  const handleLeaveFamily = () => {
    Alert.alert(
      "Leave Family",
      "Are you sure you want to leave this family network?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              if (family) {
                await familyService.leaveFamily(family.id);
                Alert.alert("Success", "You have left the family");
                router.back();
              }
            } catch {
              Alert.alert("Error", "Failed to leave family");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-neutral-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!family) {
    return (
      <View className="flex-1 bg-neutral-50">
        <View className="bg-primary-600 pt-14 pb-6 px-6">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 p-2 -ml-2"
              activeOpacity={0.7}
            >
              <ArrowLeft color="#ffffff" size={24} strokeWidth={2} />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Family Network</Text>
          </View>
        </View>
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-lg font-semibold text-neutral-900 mb-2">
            No Family Network
          </Text>
          <Text className="text-sm text-neutral-500 text-center">
            You haven't joined or created a family network yet
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Header */}
      <View className="bg-primary-600 pt-14 pb-6 px-6">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 p-2 -ml-2"
            activeOpacity={0.7}
          >
            <ArrowLeft color="#ffffff" size={24} strokeWidth={2} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">{family.name}</Text>
        </View>
        <View className="flex-row items-center">
          <View className="flex-1">
            <Text className="text-white/80 text-sm mb-1">
              {members.length} member{members.length !== 1 ? "s" : ""} • {family.userRole === "creator" ? "Creator" : "Member"}
            </Text>
            <Text className="text-white/60 text-xs">
              Created {formatDate(family.created_at)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 -mt-3">
        {/* Invite Code Card */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-xs font-semibold text-neutral-500 mb-3">
            INVITE CODE
          </Text>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-mono font-bold text-primary-600">
              {family.invite_code}
            </Text>
          </View>
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={handleCopyInviteCode}
              className="flex-1 bg-neutral-100 py-3 rounded-lg flex-row items-center justify-center"
              activeOpacity={0.7}
            >
              <Copy color="#6b7280" size={18} strokeWidth={2} />
              <Text className="text-neutral-700 font-semibold ml-2">Copy Link</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShareInviteLink}
              className="flex-1 bg-primary-600 py-3 rounded-lg flex-row items-center justify-center"
              activeOpacity={0.7}
            >
              <Share2 color="#ffffff" size={18} strokeWidth={2} />
              <Text className="text-white font-semibold ml-2">Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Family Members */}
        <Text className="text-lg font-bold text-neutral-900 mb-3 mt-2">
          Family Members
        </Text>
        <View className="bg-white rounded-2xl overflow-hidden mb-6 shadow-sm">
          {members.map((member, index) => (
            <View
              key={member.user_id}
              className={`px-4 py-4 ${index !== members.length - 1 ? "border-b border-neutral-100" : ""}`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mr-3 overflow-hidden">
                    {member.profile_image_url ? (
                      <Image
                        source={{ uri: member.profile_image_url }}
                        style={{ width: 48, height: 48 }}
                        contentFit="cover"
                      />
                    ) : (
                      <Text className="text-primary-600 font-bold text-lg">
                        {member.full_name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-base font-semibold text-neutral-900">
                        {member.full_name}
                      </Text>
                      {member.role === "creator" && (
                        <View className="ml-2 bg-yellow-100 px-2 py-0.5 rounded">
                          <Text className="text-xs font-semibold text-yellow-700">
                            Creator
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center mt-1">
                      <Clock size={12} color="#9ca3af" />
                      <Text className="text-xs text-neutral-500 ml-1">
                        Joined {formatDate(member.joined_at)}
                      </Text>
                    </View>
                  </View>
                </View>
                {family.userRole === "creator" && member.role !== "creator" && (
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(member)}
                    className="ml-2 p-2"
                    activeOpacity={0.7}
                  >
                    <UserMinus color="#ef4444" size={20} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        {family.userRole !== "creator" && (
          <TouchableOpacity
            onPress={handleLeaveFamily}
            className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-red-200"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-center">
              <Trash2 color="#ef4444" size={20} strokeWidth={2} />
              <Text className="text-red-600 font-semibold ml-2">Leave Family</Text>
            </View>
          </TouchableOpacity>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
