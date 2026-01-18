/**
 * Safe Meeting Point Selector
 * Safety-focused meeting point selection for SafeTransit users
 */

import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { MapPin, Navigation, Shield, Camera, Users, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface PickupPoint {
  id: string;
  latitude: number;
  longitude: number;
  type: 'entrance' | 'gate' | 'parking' | 'platform' | 'terminal' | 'main' | 'side';
  name: string;
  description?: string;
  distance_meters?: number;
  distance_km?: string;
}

interface PickupPointSelectorProps {
  locationName: string;
  pickupPoints: PickupPoint[];
  selectedPickupId?: string | null;
  onSelectPickup: (pickupId: string) => void;
  onClose: () => void;
  mode: 'start' | 'end';
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'gate':
      return '🚪';
    case 'entrance':
    case 'main':
      return '🏢';
    case 'parking':
      return '🅿️';
    case 'platform':
      return '🚉';
    case 'terminal':
      return '✈️';
    case 'side':
      return '🚶';
    default:
      return '📍';
  }
};

const formatDistance = (distanceMeters?: number, distanceKm?: string): string => {
  if (distanceKm) {
    const km = parseFloat(distanceKm);
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  }
  if (distanceMeters !== undefined) {
    if (distanceMeters < 1000) {
      return `${Math.round(distanceMeters)}m`;
    }
    return `${(distanceMeters / 1000).toFixed(1)}km`;
  }
  return '';
};

export default function PickupPointSelector({
  locationName,
  pickupPoints,
  selectedPickupId,
  onSelectPickup,
  onClose,
  mode,
}: PickupPointSelectorProps) {
  const modeColor = mode === 'start' ? 'bg-primary-600' : 'bg-danger-600';
  const modeColorLight = mode === 'start' ? 'bg-primary-50' : 'bg-danger-50';
  const modeColorText = mode === 'start' ? 'text-primary-600' : 'text-danger-600';
  const ModeIcon = mode === 'start' ? Navigation : MapPin;

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        className="flex-1 bg-black/50"
        onPress={onClose}
      >
        {/* Bottom Sheet Container */}
        <Pressable
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl pb-8"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
      <View className="border-b border-neutral-100 pb-4 pt-6 px-6">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xl font-bold text-neutral-900">
            Select Pickup Point
          </Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            className="w-8 h-8 bg-neutral-100 rounded-full items-center justify-center"
          >
            <Text className="text-neutral-600 text-lg font-semibold">×</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          <View className={`w-10 h-10 ${modeColor} rounded-full items-center justify-center mr-3`}>
            <ModeIcon color="#ffffff" size={20} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-neutral-900" numberOfLines={1}>
              {locationName}
            </Text>
            <Text className="text-sm text-neutral-500">
              {pickupPoints.length} pickup {pickupPoints.length === 1 ? 'point' : 'points'} available
            </Text>
          </View>
        </View>
      </View>

      {/* Pickup Points List */}
      <ScrollView
        className="max-h-80"
        showsVerticalScrollIndicator={false}
      >
        {pickupPoints.length === 0 ? (
          <View className="p-8 items-center">
            <Text className="text-base font-semibold text-neutral-700 mb-2">
              No pickup points available
            </Text>
            <Text className="text-sm text-neutral-400 text-center">
              This location doesn't have verified pickup points yet
            </Text>
          </View>
        ) : (
          pickupPoints.map((point, index) => {
          const isSelected = selectedPickupId === point.id;
          const distance = formatDistance(point.distance_meters, point.distance_km);

          return (
            <TouchableOpacity
              key={point.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectPickup(point.id);
              }}
              className={`flex-row items-center px-6 py-4 ${
                index > 0 ? 'border-t border-neutral-50' : ''
              } ${isSelected ? modeColorLight : 'active:bg-neutral-50'}`}
              activeOpacity={0.7}
            >
              {/* Number Badge */}
              <View className="mr-4">
                <View className={`w-8 h-8 rounded-full items-center justify-center ${
                  isSelected ? modeColor : 'bg-emerald-500'
                }`}>
                  <Text className="text-white text-sm font-bold">{index + 1}</Text>
                </View>
              </View>

              {/* Icon */}
              <View className="mr-3">
                <Text className="text-2xl">{getTypeIcon(point.type)}</Text>
              </View>

              {/* Details */}
              <View className="flex-1">
                <Text className={`text-base font-semibold ${
                  isSelected ? modeColorText : 'text-neutral-900'
                }`} numberOfLines={1}>
                  {point.name}
                </Text>
                {point.description && (
                  <Text className="text-sm text-neutral-500 mt-0.5" numberOfLines={1}>
                    {point.description}
                  </Text>
                )}
                <Text className="text-xs text-neutral-400 mt-1 capitalize">
                  {point.type}
                </Text>
              </View>

              {/* Distance */}
              {distance && (
                <View className="ml-3">
                  <Text className={`text-sm font-medium ${
                    isSelected ? modeColorText : 'text-neutral-600'
                  }`}>
                    {distance}
                  </Text>
                </View>
              )}

              {/* Selected Check */}
              {isSelected && (
                <View className="ml-2">
                  <View className={`w-6 h-6 ${modeColor} rounded-full items-center justify-center`}>
                    <Text className="text-white text-xs font-bold">✓</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })
        )}
      </ScrollView>

      {/* Footer Hint */}
      <View className="px-6 pt-4">
        <View className="flex-row items-center justify-center py-3 px-4 bg-neutral-50 rounded-xl">
          <Crosshair size={16} color="#6b7280" />
          <Text className="text-xs text-neutral-500 ml-2">
            Tap a pickup point to select the best entrance for your trip
          </Text>
        </View>
      </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
