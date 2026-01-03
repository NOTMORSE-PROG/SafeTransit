import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Polygon, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  AlertOctagon,
  ShieldCheck,
  Cloud,
  Search,
  Lightbulb,
  AlertTriangle
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const SHEET_MIN_HEIGHT = 280;
const SHEET_MAX_HEIGHT = 380;
const SHEET_PEEK_HEIGHT = 40; // Height when collapsed (just showing handle)

interface TipData {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  message: string;
  category: string;
}

// Mock data for demonstration
const MOCK_ZONES = [
  {
    id: '1',
    coordinates: [
      { latitude: 14.5995, longitude: 120.9842 },
      { latitude: 14.5985, longitude: 120.9852 },
      { latitude: 14.5975, longitude: 120.9842 },
      { latitude: 14.5985, longitude: 120.9832 },
    ],
    risk_level: 3,
    name: 'High Risk Area'
  },
  {
    id: '2',
    coordinates: [
      { latitude: 14.6005, longitude: 120.9862 },
      { latitude: 14.5995, longitude: 120.9872 },
      { latitude: 14.5985, longitude: 120.9862 },
      { latitude: 14.5995, longitude: 120.9852 },
    ],
    risk_level: 2,
    name: 'Caution Area'
  },
  {
    id: '3',
    coordinates: [
      { latitude: 14.6015, longitude: 120.9832 },
      { latitude: 14.6005, longitude: 120.9842 },
      { latitude: 14.5995, longitude: 120.9832 },
      { latitude: 14.6005, longitude: 120.9822 },
    ],
    risk_level: 1,
    name: 'Safe Area'
  }
];

const MOCK_TIPS = [
  {
    id: '1',
    latitude: 14.5995,
    longitude: 120.9842,
    title: 'Well-Lit Path',
    message: 'Use Exit 3 after train - well-lit and has security',
    category: 'lighting'
  },
  {
    id: '2',
    latitude: 14.6005,
    longitude: 120.9862,
    title: 'Caution',
    message: 'Avoid this area after 8 PM',
    category: 'safety'
  }
];

export default function Home() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [isProtectionOn, setIsProtectionOn] = useState(true);
  const [_currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [selectedTip, setSelectedTip] = useState<TipData | null>(null);
  const [_isSheetExpanded, setIsSheetExpanded] = useState(false);

  const translateY = useSharedValue(SHEET_MAX_HEIGHT - SHEET_MIN_HEIGHT);
  const startY = useSharedValue(0);

  const INITIAL_REGION = {
    latitude: 14.5995,
    longitude: 120.9842,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      const newY = startY.value + event.translationY;
      // 0 = fully expanded, max = collapsed to peek
      const minY = 0;
      const maxY = SHEET_MAX_HEIGHT - SHEET_PEEK_HEIGHT;
      if (newY >= minY && newY <= maxY) {
        translateY.value = newY;
      }
    })
    .onEnd((event) => {
      const middleThreshold = (SHEET_MAX_HEIGHT - SHEET_MIN_HEIGHT) / 2;
      const collapseThreshold = SHEET_MAX_HEIGHT - SHEET_PEEK_HEIGHT - 50;

      // Slide up = expand
      if (event.velocityY < -500 || translateY.value < middleThreshold) {
        translateY.value = withSpring(0);
        runOnJS(setIsSheetExpanded)(true);
      }
      // Slide down fast or far = hide to peek
      else if (event.velocityY > 500 || translateY.value > collapseThreshold) {
        translateY.value = withSpring(SHEET_MAX_HEIGHT - SHEET_PEEK_HEIGHT);
        runOnJS(setIsSheetExpanded)(false);
      }
      // Return to middle position
      else {
        translateY.value = withSpring(SHEET_MAX_HEIGHT - SHEET_MIN_HEIGHT);
        runOnJS(setIsSheetExpanded)(false);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const getZoneColor = (riskLevel: number) => {
    switch (riskLevel) {
      case 3:
        return 'rgba(239, 68, 68, 0.2)'; // Danger - lighter fill
      case 2:
        return 'rgba(245, 158, 11, 0.2)'; // Caution - lighter fill
      case 1:
        return 'rgba(34, 197, 94, 0.15)'; // Safe - lighter fill
      default:
        return 'rgba(156, 163, 175, 0.2)';
    }
  };

  const getZoneStrokeColor = (riskLevel: number) => {
    switch (riskLevel) {
      case 3:
        return '#EF4444'; // Danger red
      case 2:
        return '#F59E0B'; // Caution amber
      case 1:
        return '#22C55E'; // Safe green
      default:
        return '#9CA3AF';
    }
  };

  const getZoneStrokeWidth = (riskLevel: number) => {
    return riskLevel === 3 ? 3 : 2.5; // Thicker for danger
  };

  const getZoneStrokeDash = (riskLevel: number) => {
    return riskLevel === 2 ? [8, 4] : undefined; // Dashed for caution
  };

  const handleToggleProtection = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProtectionOn(!isProtectionOn);

    if (!isProtectionOn) {
      Alert.alert(
        'Protection Enabled',
        'Background monitoring is now active. You will be alerted when entering high-risk zones.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePanicPress = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Alert.alert(
      'Emergency Alert',
      'Silent alert sent to nearby helpers and emergency contacts.',
      [{ text: 'OK' }]
    );
  };

  const handleQuickExit = () => {
    router.push('/quick-exit');
  };

  return (
    <View className="flex-1">
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ width, height }}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {/* Safety Zones */}
        {MOCK_ZONES.map((zone) => (
          <Polygon
            key={zone.id}
            coordinates={zone.coordinates}
            fillColor={getZoneColor(zone.risk_level)}
            strokeColor={getZoneStrokeColor(zone.risk_level)}
            strokeWidth={getZoneStrokeWidth(zone.risk_level)}
            lineDashPattern={getZoneStrokeDash(zone.risk_level)}
          />
        ))}

        {/* Community Tips */}
        {MOCK_TIPS.map((tip) => (
          <Marker
            key={tip.id}
            coordinate={{ latitude: tip.latitude, longitude: tip.longitude }}
            onPress={() => setSelectedTip(tip)}
            accessible={true}
            accessibilityLabel={`${tip.title} - ${tip.category} tip`}
            accessibilityHint="Double tap to read full tip"
          >
            <View className="bg-white rounded-full p-2 shadow-lg">
              {tip.category === 'lighting' ? (
                <Lightbulb color="#f59e0b" size={20} strokeWidth={2} />
              ) : (
                <AlertTriangle color="#ef4444" size={20} strokeWidth={2} />
              )}
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Simple Top Bar */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        className="absolute top-12 left-6 right-6 flex-row items-center justify-between"
      >
        {/* Status Badge */}
        <View className={`px-4 py-2 rounded-full shadow-lg ${isProtectionOn ? 'bg-primary-600' : 'bg-neutral-500'}`}>
          <View className="flex-row items-center">
            <ShieldCheck color="#ffffff" size={16} strokeWidth={2.5} />
            <Text className="text-white text-sm font-semibold ml-2">
              {isProtectionOn ? 'Protected' : 'Unprotected'}
            </Text>
          </View>
        </View>

        {/* Quick Exit */}
        <TouchableOpacity
          onPress={handleQuickExit}
          className="bg-white/95 rounded-full p-3 shadow-lg"
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel="Quick exit to weather disguise"
          accessibilityRole="button"
        >
          <Cloud color="#60a5fa" size={24} strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>

      {/* Legend */}
      <View className="absolute top-24 right-6 bg-white/95 rounded-xl p-3 shadow-md" style={{ marginTop: 40 }}>
        <View className="flex-row items-center mb-1.5">
          <View className="w-4 h-3 rounded bg-safe-500 mr-2" style={{ borderWidth: 1, borderColor: '#22C55E' }} />
          <Text className="text-xs text-neutral-700">Safe</Text>
        </View>
        <View className="flex-row items-center mb-1.5">
          <View className="w-4 h-3 rounded bg-caution-500/20 mr-2" style={{ borderWidth: 1, borderColor: '#F59E0B', borderStyle: 'dashed' }} />
          <Text className="text-xs text-neutral-700">Caution</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-4 h-3 rounded bg-danger-500 mr-2" style={{ borderWidth: 1.5, borderColor: '#EF4444' }} />
          <Text className="text-xs text-neutral-700">Risk</Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      <Animated.View
        entering={SlideInUp.duration(600)}
        className="absolute left-0 right-0 bg-white rounded-t-3xl shadow-2xl"
        style={[
          {
            bottom: 0,
            paddingBottom: 80,
            height: SHEET_MAX_HEIGHT
          },
          sheetStyle
        ]}
      >
        <View className="px-6 pt-6">
          {/* Handle Bar - Draggable */}
          <GestureDetector gesture={panGesture}>
            <Animated.View className="items-center py-3 mb-4">
              <View className="w-16 h-1.5 bg-neutral-400 rounded-full" />
            </Animated.View>
          </GestureDetector>

          {/* Protection Toggle */}
          <TouchableOpacity
            onPress={handleToggleProtection}
            className={`rounded-2xl p-4 mb-4 ${isProtectionOn ? 'bg-primary-50 border-2 border-primary-600' : 'bg-neutral-100 border-2 border-neutral-300'}`}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Background protection toggle"
            accessibilityRole="button"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${isProtectionOn ? 'bg-primary-600' : 'bg-neutral-400'}`}>
                  <ShieldCheck color="#ffffff" size={24} strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-neutral-900 mb-1">
                    Background Protection
                  </Text>
                  <Text className={`text-xs ${isProtectionOn ? 'text-primary-700' : 'text-neutral-500'}`}>
                    {isProtectionOn ? 'Monitoring your location' : 'Tap to enable protection'}
                  </Text>
                </View>
              </View>
              <View className={`w-12 h-7 rounded-full justify-center ${isProtectionOn ? 'bg-primary-600' : 'bg-neutral-300'}`}>
                <View className={`w-5 h-5 rounded-full bg-white shadow ${isProtectionOn ? 'ml-6' : 'ml-1'}`} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Search Destination */}
          <TouchableOpacity
            onPress={() => router.push('/route-planning')}
            className="bg-neutral-100 rounded-2xl p-4 mb-4"
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Plan safe route"
            accessibilityRole="button"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3">
                <Search color="#2563eb" size={20} strokeWidth={2} />
              </View>
              <Text className="text-neutral-500 text-base flex-1 font-medium">
                Where do you want to go?
              </Text>
              <Text className="text-primary-600 text-xl">›</Text>
            </View>
          </TouchableOpacity>

          {/* Quick Actions */}
          <TouchableOpacity
            onPress={() => router.push('/add-tip')}
            className="bg-primary-600 rounded-2xl py-4"
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Add community safety tip"
            accessibilityRole="button"
          >
            <View className="items-center">
              <Lightbulb color="#ffffff" size={28} strokeWidth={2} />
              <Text className="text-white font-bold text-sm mt-1">Add Safety Tip</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Selected Tip Card */}
      {selectedTip && (
        <Animated.View
          entering={SlideInUp.duration(400)}
          className="absolute left-6 right-6"
          style={{ bottom: height * 0.38 }}
        >
          <View className="bg-white rounded-2xl p-4 shadow-2xl border border-neutral-100">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-2">
                <View className="flex-row items-center mb-2">
                  <View className="mr-2">
                    {selectedTip.category === 'lighting' ? (
                      <Lightbulb color="#f59e0b" size={20} strokeWidth={2} />
                    ) : (
                      <AlertTriangle color="#ef4444" size={20} strokeWidth={2} />
                    )}
                  </View>
                  <Text className="text-base font-bold text-neutral-900 flex-1">
                    {selectedTip.title}
                  </Text>
                </View>
                <Text className="text-sm text-neutral-600 leading-5">
                  {selectedTip.message}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedTip(null)}
                className="bg-neutral-100 rounded-full w-8 h-8 items-center justify-center"
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel="Close tip"
                accessibilityRole="button"
              >
                <Text className="text-neutral-600 text-2xl font-light">×</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* FLOATING EMERGENCY BUTTON - Always Visible */}
      <Animated.View
        entering={FadeIn.delay(800)}
        className="absolute z-50"
        style={{ bottom: 100, right: 24 }}
      >
        <TouchableOpacity
          onLongPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            handlePanicPress();
          }}
          onPress={() => {
            Alert.alert(
              'Emergency Alert',
              'Send silent alert to emergency contacts and nearby helpers?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Send Alert',
                  style: 'destructive',
                  onPress: handlePanicPress
                }
              ]
            );
          }}
          className="w-18 h-18 rounded-full bg-danger-600 items-center justify-center"
          style={{
            shadowColor: '#dc2626',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 12,
          }}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Emergency alert button"
          accessibilityHint="Tap to confirm, or long press for silent alert"
          accessibilityRole="button"
        >
          <AlertOctagon color="#ffffff" size={36} strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
