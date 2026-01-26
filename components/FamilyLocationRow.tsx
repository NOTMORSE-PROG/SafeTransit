import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";
import { UserCircle, Plus } from "lucide-react-native";
import {
  familyLocationService,
  FamilyMember,
} from "../services/familyLocationService";
import { colors } from "../constants/theme";

interface FamilyLocationRowProps {
  onMemberPress: (member: FamilyMember) => void;
  onCenterOnMember: (member: FamilyMember) => void;
  className?: string;
}

const FamilyLocationRow: React.FC<FamilyLocationRowProps> = ({
  onMemberPress,
  onCenterOnMember,
  className = "",
}) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFamilyLocations = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }
      const locations = await familyLocationService.getFamilyLocations();
      setFamilyMembers(locations);
    } catch (err) {
      // Don't clear family members on error - keep showing current data
      console.error("Family locations error:", err);
      if (!silent) {
        setError("Failed to load family locations");
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadFamilyLocations(); // Initial load with loading indicator

    // Refresh every 30 seconds silently
    const interval = setInterval(() => {
      loadFamilyLocations(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (member: FamilyMember): string => {
    const now = Date.now();
    const memberTime = new Date(member.timestamp).getTime();
    const timeDiff = now - memberTime;

    // Check for SOS simulation (Carlos Mendoza mock)
    if (member.full_name === "Carlos Mendoza") {
      return "#ef4444"; // Red for SOS
    }

    if (member.is_live && timeDiff < 2 * 60 * 1000) {
      return "#10b981"; // Green for live (< 2 min)
    }

    return "#9ca3af"; // Gray for offline/last known
  };

  const getStatusText = (member: FamilyMember): string => {
    const now = Date.now();
    const memberTime = new Date(member.timestamp).getTime();
    const timeDiff = now - memberTime;

    if (member.full_name === "Carlos Mendoza") {
      return "SOS ACTIVE 🚨";
    }

    if (member.is_live && timeDiff < 2 * 60 * 1000) {
      return "Live";
    }

    // Calculate time ago
    const minutes = Math.floor(timeDiff / (60 * 1000));
    const hours = Math.floor(minutes / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else {
      return `${hours}h ago`;
    }
  };

  const visibleMembers = familyMembers.slice(0, 5);
  const additionalCount = Math.max(0, familyMembers.length - 5);

  if (isLoading) {
    return (
      <View className={`p-4 ${className}`}>
        <View className="flex-row items-center mb-3">
          <Text className="text-gray-900 font-semibold text-lg">
            Family Members
          </Text>
        </View>
        <View className="flex-row items-center justify-center py-8">
          <ActivityIndicator size="small" color={colors.primary[600]} />
          <Text className="ml-2 text-gray-600">
            Loading family locations...
          </Text>
        </View>
      </View>
    );
  }

  if (error || familyMembers.length === 0) {
    return (
      <View className={`p-4 ${className}`}>
        <View className="flex-row items-center mb-3">
          <Text className="text-gray-900 font-semibold text-lg">
            Family Members
          </Text>
        </View>
        <View className="bg-gray-50 rounded-xl p-4 flex-row items-center justify-center">
          <Text className="text-gray-600 text-center">
            {error || "No family members sharing location"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn} className={`p-4 ${className}`}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-gray-900 font-semibold text-lg">
          Family Members
        </Text>
        <TouchableOpacity className="flex-row items-center">
          <Plus size={16} color={colors.primary[600]} />
          <Text className="ml-1 text-blue-600 font-medium">Invite</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {visibleMembers.map((member, _index) => {
          const statusColor = getStatusColor(member);
          const isSOSActive = member.full_name === "Carlos Mendoza";

          return (
            <TouchableOpacity
              key={member.user_id}
              onPress={() => onMemberPress(member)}
              onLongPress={() => onCenterOnMember(member)}
              className="items-center mr-4 min-w-[70px]"
              activeOpacity={0.7}
            >
              {/* Avatar with Status Ring */}
              <View className="relative mb-2">
                <View
                  className="w-14 h-14 rounded-full border-3"
                  style={{ borderColor: statusColor }}
                >
                  {member.profile_image_url ? (
                    <Image
                      source={{ uri: member.profile_image_url }}
                      className="w-full h-full rounded-full"
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-full h-full rounded-full bg-gray-200 items-center justify-center">
                      <UserCircle size={28} color="#6b7280" />
                    </View>
                  )}
                </View>

                {/* Status Dot */}
                <View
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                  style={{ backgroundColor: statusColor }}
                />
              </View>

              {/* Name and Status */}
              <Text
                className="text-xs font-medium text-gray-900 text-center leading-tight"
                numberOfLines={2}
              >
                {member.full_name}
              </Text>
              <Text
                className={`text-xs text-center mt-1 ${
                  isSOSActive ? "text-red-600 font-bold" : "text-gray-500"
                }`}
                numberOfLines={1}
              >
                {getStatusText(member)}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Additional Members Indicator */}
        {additionalCount > 0 && (
          <TouchableOpacity
            className="items-center mr-4 min-w-[70px]"
            activeOpacity={0.7}
          >
            <View className="w-14 h-14 rounded-full bg-gray-100 border-2 border-gray-300 items-center justify-center mb-2">
              <Text className="text-gray-600 font-semibold text-sm">
                +{additionalCount}
              </Text>
            </View>
            <Text className="text-xs text-gray-500 text-center">More</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </Animated.View>
  );
};

export default FamilyLocationRow;
