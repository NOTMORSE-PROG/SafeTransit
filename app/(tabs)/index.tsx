import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Polygon, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

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
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [selectedTip, setSelectedTip] = useState<TipData | null>(null);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

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
        return 'rgba(239, 68, 68, 0.3)';
      case 2:
        return 'rgba(245, 158, 11, 0.3)';
      case 1:
        return 'rgba(34, 197, 94, 0.3)';
      default:
        return 'rgba(156, 163, 175, 0.3)';
    }
  };

  const getZoneStrokeColor = (riskLevel: number) => {
    switch (riskLevel) {
      case 3:
        return '#EF4444';
      case 2:
        return '#F59E0B';
      case 1:
        return '#22C55E';
      default:
        return '#9CA3AF';
    }
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
            strokeWidth={2}
          />
        ))}

        {/* Community Tips */}
        {MOCK_TIPS.map((tip) => (
          <Marker
            key={tip.id}
            coordinate={{ latitude: tip.latitude, longitude: tip.longitude }}
            onPress={() => setSelectedTip(tip)}
          >
            <View className="bg-white rounded-full p-2 shadow-lg">
              <Text className="text-xl">{tip.category === 'lighting' ? '💡' : '⚠️'}</Text>
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
        <View className={`px-4 py-2 rounded-full shadow-lg ${isProtectionOn ? 'bg-success-500' : 'bg-gray-500'}`}>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-white mr-2" />
            <Text className="text-white text-sm font-semibold">
              {isProtectionOn ? 'Protected' : 'Unprotected'}
            </Text>
          </View>
        </View>

        {/* Quick Exit */}
        <TouchableOpacity
          onPress={handleQuickExit}
          className="bg-white/95 rounded-full p-3 shadow-lg"
          activeOpacity={0.7}
        >
          <Text className="text-xl">☁️</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Legend */}
      <View className="absolute top-24 right-6 bg-white/95 rounded-xl p-3 shadow-md" style={{ marginTop: 40 }}>
        <View className="flex-row items-center mb-1">
          <View className="w-3 h-3 rounded-full bg-success-500 mr-2" />
          <Text className="text-xs text-gray-700">Safe</Text>
        </View>
        <View className="flex-row items-center mb-1">
          <View className="w-3 h-3 rounded-full bg-warning-500 mr-2" />
          <Text className="text-xs text-gray-700">Caution</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-danger-500 mr-2" />
          <Text className="text-xs text-gray-700">Risk</Text>
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
          {/* Handle Bar - Only this is draggable */}
          <GestureDetector gesture={panGesture}>
            <Animated.View className="items-center py-3 mb-4">
              <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </Animated.View>
          </GestureDetector>

          {/* Protection Toggle */}
          <TouchableOpacity
            onPress={handleToggleProtection}
            className={`rounded-2xl p-4 mb-4 ${isProtectionOn ? 'bg-success-50 border-2 border-success-500' : 'bg-gray-100 border-2 border-gray-300'}`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${isProtectionOn ? 'bg-success-500' : 'bg-gray-400'}`}>
                  <Text className="text-2xl">🛡️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900 mb-1">
                    Background Protection
                  </Text>
                  <Text className={`text-xs ${isProtectionOn ? 'text-success-700' : 'text-gray-500'}`}>
                    {isProtectionOn ? 'Monitoring your location' : 'Tap to enable protection'}
                  </Text>
                </View>
              </View>
              <View className={`w-12 h-7 rounded-full justify-center ${isProtectionOn ? 'bg-success-500' : 'bg-gray-300'}`}>
                <View className={`w-5 h-5 rounded-full bg-white shadow ${isProtectionOn ? 'ml-6' : 'ml-1'}`} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Search Destination */}
          <TouchableOpacity
            onPress={() => router.push('/route-planning')}
            className="bg-gray-100 rounded-2xl p-4 mb-4"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3">
                <Text className="text-xl">🔍</Text>
              </View>
              <Text className="text-gray-500 text-base flex-1 font-medium">
                Where do you want to go?
              </Text>
              <Text className="text-primary-600 text-xl">›</Text>
            </View>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View className="flex-row justify-between gap-3">
            <TouchableOpacity
              onPress={() => router.push('/add-tip')}
              className="bg-primary-600 rounded-2xl flex-1 py-4"
              activeOpacity={0.8}
            >
              <View className="items-center">
                <Text className="text-3xl mb-1">💡</Text>
                <Text className="text-white font-bold text-sm">Add Tip</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePanicPress}
              className="bg-danger-600 rounded-2xl flex-1 py-4"
              activeOpacity={0.8}
            >
              <View className="items-center">
                <Text className="text-3xl mb-1">🚨</Text>
                <Text className="text-white font-bold text-sm">Emergency</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Selected Tip Card */}
      {selectedTip && (
        <Animated.View
          entering={SlideInUp.duration(400)}
          className="absolute left-6 right-6"
          style={{ bottom: height * 0.38 }}
        >
          <View className="bg-white rounded-2xl p-4 shadow-2xl border border-gray-100">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-2">
                <View className="flex-row items-center mb-2">
                  <Text className="text-xl mr-2">{selectedTip.category === 'lighting' ? '💡' : '⚠️'}</Text>
                  <Text className="text-base font-bold text-gray-900 flex-1">
                    {selectedTip.title}
                  </Text>
                </View>
                <Text className="text-sm text-gray-600 leading-5">
                  {selectedTip.message}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedTip(null)}
                className="bg-gray-100 rounded-full w-8 h-8 items-center justify-center"
                activeOpacity={0.7}
              >
                <Text className="text-gray-600 text-2xl font-light">×</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
