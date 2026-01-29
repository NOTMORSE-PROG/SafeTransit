import React from "react";
import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import { Image } from "expo-image";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  X,
  UserCircle,
  MapPin,
  Clock,
  Navigation,
  AlertTriangle,
} from "lucide-react-native";
import { FamilyMember } from "../services/familyLocationService";

interface FamilyMemberModalProps {
  member: FamilyMember | null;
  isVisible: boolean;
  onClose: () => void;
  onCenterOnMap: (member: FamilyMember) => void;
}

const FamilyMemberModal: React.FC<FamilyMemberModalProps> = ({
  member,
  isVisible,
  onClose,
  onCenterOnMap,
}) => {
  const insets = useSafeAreaInsets();
  if (!member) return null;

  const getStatusInfo = (member: FamilyMember) => {
    const now = Date.now();
    const memberTime = new Date(member.timestamp).getTime();
    const timeDiff = now - memberTime;

    // Check for SOS simulation
    if (member.full_name === "Carlos Mendoza") {
      return {
        status: "SOS ACTIVE 🚨",
        color: "#DC2626",
        icon: AlertTriangle,
        isEmergency: true,
      };
    }

    if (member.is_live && timeDiff < 2 * 60 * 1000) {
      return {
        status: "Live",
        color: "#10B981",
        icon: MapPin,
        isEmergency: false,
      };
    }

    // Calculate time ago
    const minutes = Math.floor(timeDiff / (60 * 1000));
    const hours = Math.floor(minutes / 60);

    const timeAgo =
      minutes < 60
        ? `${minutes} min ago`
        : `${hours} hour${hours > 1 ? "s" : ""} ago`;

    return {
      status: `Last seen ${timeAgo}`,
      color: "#6b7280",
      icon: Clock,
      isEmergency: false,
    };
  };

  const getFormattedAddress = () => {
    // Mock address based on coordinates (in real app, use reverse geocoding)
    const { latitude, longitude } = member;

    // Simple mock address generator based on known Manila coordinates
    if (latitude >= 14.55 && latitude <= 14.56) {
      return "Makati Central Business District, Makati City";
    } else if (latitude >= 14.59 && latitude <= 14.6) {
      return "Manila City Hall Area, Manila";
    } else if (latitude >= 14.64 && latitude <= 14.66) {
      return "Quezon City, Metro Manila";
    } else if (latitude >= 14.57 && latitude <= 14.58) {
      return "Bonifacio Global City, Taguig";
    } else {
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  };

  const statusInfo = getStatusInfo(member);
  const StatusIcon = statusInfo.icon;
  const formattedTime = new Date(member.timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Animated.View
          entering={SlideInDown.duration(400)}
          exiting={SlideOutDown.duration(300)}
          className="bg-white rounded-t-3xl"
          style={{ maxHeight: "60%" }}
        >
          <Pressable>
            {/* Handle Bar */}
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mt-3 mb-6" />

            {/* Header */}
            <View className="flex-row items-center justify-between px-6 mb-6">
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">
                  Family Member Info
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Member Details */}
            <View className="px-6 pb-8">
              {/* Avatar and Basic Info */}
              <View className="flex-row items-center mb-6">
                <View className="relative mr-4">
                  <View
                    className="w-20 h-20 rounded-full border-4"
                    style={{ borderColor: statusInfo.color }}
                  >
                    {member.profile_image_url ? (
                      <Image
                        source={{ uri: member.profile_image_url }}
                        className="w-full h-full rounded-full"
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-full h-full rounded-full bg-gray-200 items-center justify-center">
                        <UserCircle size={40} color="#6b7280" />
                      </View>
                    )}
                  </View>

                  {/* Status Dot */}
                  <View
                    className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-3 border-white"
                    style={{ backgroundColor: statusInfo.color }}
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-2xl font-bold text-gray-900 mb-1">
                    {member.full_name}
                  </Text>
                  <View className="flex-row items-center">
                    <StatusIcon size={16} color={statusInfo.color} />
                    <Text
                      className={`ml-2 font-medium ${
                        statusInfo.isEmergency
                          ? "text-red-600 text-base"
                          : "text-gray-600"
                      }`}
                    >
                      {statusInfo.status}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Location Details */}
              <View className="space-y-4">
                {/* Address */}
                <View className="bg-gray-50 rounded-2xl p-4">
                  <View className="flex-row items-start">
                    <MapPin size={20} color="#6b7280" className="mt-0.5" />
                    <View className="ml-3 flex-1">
                      <Text className="text-sm text-gray-500 font-medium mb-1">
                        Current Location
                      </Text>
                      <Text className="text-gray-900 font-medium">
                        {getFormattedAddress()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Timestamp */}
                <View className="bg-gray-50 rounded-2xl p-4">
                  <View className="flex-row items-center">
                    <Clock size={20} color="#6b7280" />
                    <View className="ml-3 flex-1">
                      <Text className="text-sm text-gray-500 font-medium mb-1">
                        Last Updated
                      </Text>
                      <Text className="text-gray-900 font-medium">
                        Today at {formattedTime}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Coordinates (for development) */}
                <View className="bg-blue-50 rounded-2xl p-4">
                  <Text className="text-sm text-blue-600 font-medium mb-1">
                    Coordinates
                  </Text>
                  <Text className="text-blue-800 font-mono text-sm">
                    {member.latitude.toFixed(6)}, {member.longitude.toFixed(6)}
                  </Text>
                  {member.accuracy && (
                    <Text className="text-blue-600 text-xs mt-1">
                      ±{Math.round(member.accuracy)}m accuracy
                    </Text>
                  )}
                </View>
              </View>

              {/* Actions */}
              <View className="mt-8" style={{ marginBottom: Math.max(insets.bottom, 20) }}>
                <TouchableOpacity
                  onPress={() => {
                    onCenterOnMap(member);
                    onClose();
                  }}
                  className="bg-blue-600 rounded-2xl p-4 flex-row items-center justify-center"
                  activeOpacity={0.8}
                >
                  <Navigation size={20} color="white" />
                  <Text className="ml-2 text-white font-semibold text-lg">
                    Center on Map
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

export default FamilyMemberModal;
