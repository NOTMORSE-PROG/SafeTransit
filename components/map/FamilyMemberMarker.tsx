import React from "react";
import { View } from "react-native";
import { Marker } from "react-native-maps";
import { Image } from "expo-image";
import { UserCircle } from "lucide-react-native";
import { FamilyMember } from "../../services/familyLocationService";

interface FamilyMemberMarkerProps {
  member: FamilyMember;
  onPress?: (member: FamilyMember) => void;
}

const FamilyMemberMarker: React.FC<FamilyMemberMarkerProps> = ({
  member,
  onPress,
}) => {
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

  const statusColor = getStatusColor(member);

  return (
    <Marker
      coordinate={{
        latitude: member.latitude,
        longitude: member.longitude,
      }}
      onPress={() => onPress?.(member)}
      tracksViewChanges={false}
    >
      <View className="items-center">
        {/* Avatar with status ring */}
        <View
          className="w-12 h-12 rounded-full border-3"
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

        {/* Status dot */}
        <View
          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
          style={{ backgroundColor: statusColor }}
        />

        {/* Pointer */}
        <View
          className="w-0 h-0 border-l-4 border-r-4 border-t-8"
          style={{
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderTopColor: statusColor,
            marginTop: -1,
          }}
        />
      </View>
    </Marker>
  );
};

export default FamilyMemberMarker;
