import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import Animated, { FadeInDown, SlideInDown } from 'react-native-reanimated';

const TRAVEL_MODES = [
  { id: 'walk', label: 'Walk', emoji: '🚶‍♀️' },
  { id: 'drive', label: 'Drive', emoji: '🚗' },
  { id: 'transit', label: 'Transit', emoji: '🚌' }
];

const MOCK_ROUTES = [
  {
    id: '1',
    name: 'Safest Route',
    duration: '25 min',
    distance: '2.8 km',
    safety: 'high',
    coordinates: [
      { latitude: 14.5995, longitude: 120.9842 },
      { latitude: 14.6005, longitude: 120.9852 },
      { latitude: 14.6015, longitude: 120.9862 },
      { latitude: 14.6025, longitude: 120.9872 },
    ],
    color: '#22C55E',
    warnings: []
  },
  {
    id: '2',
    name: 'Fastest Route',
    duration: '18 min',
    distance: '2.1 km',
    safety: 'medium',
    coordinates: [
      { latitude: 14.5995, longitude: 120.9842 },
      { latitude: 14.6000, longitude: 120.9850 },
      { latitude: 14.6010, longitude: 120.9860 },
      { latitude: 14.6025, longitude: 120.9872 },
    ],
    color: '#F59E0B',
    warnings: ['Passes through 1 caution zone']
  }
];

export default function RoutePlanning() {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [selectedMode, setSelectedMode] = useState('walk');
  const [selectedRoute, setSelectedRoute] = useState<typeof MOCK_ROUTES[0] | null>(null);
  const [showRoutes, setShowRoutes] = useState(false);

  const INITIAL_REGION = {
    latitude: 14.6010,
    longitude: 120.9857,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  const handleSearch = () => {
    if (destination.trim()) {
      setShowRoutes(true);
      setSelectedRoute(MOCK_ROUTES[0]);
    }
  };

  const handleStartNavigation = () => {
    router.back();
    // In a real app, this would start turn-by-turn navigation
  };

  return (
    <View className="flex-1 bg-white">
      {/* Map */}
      <MapView
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        initialRegion={INITIAL_REGION}
        showsUserLocation
      >
        {/* Starting Point */}
        <Marker
          coordinate={{ latitude: 14.5995, longitude: 120.9842 }}
          title="Your Location"
        >
          <View className="bg-primary-600 w-6 h-6 rounded-full border-2 border-white" />
        </Marker>

        {/* Destination */}
        {showRoutes && (
          <Marker
            coordinate={{ latitude: 14.6025, longitude: 120.9872 }}
            title="Destination"
          >
            <View className="bg-danger-600 p-2 rounded-full">
              <Text className="text-white text-xl">📍</Text>
            </View>
          </Marker>
        )}

        {/* Routes */}
        {showRoutes && MOCK_ROUTES.map((route) => (
          <Polyline
            key={route.id}
            coordinates={route.coordinates}
            strokeColor={route.id === selectedRoute?.id ? route.color : '#D1D5DB'}
            strokeWidth={route.id === selectedRoute?.id ? 5 : 3}
          />
        ))}
      </MapView>

      {/* Top Bar */}
      <View className="absolute top-0 left-0 right-0 pt-12 px-6">
        <View className="bg-white rounded-2xl shadow-xl">
          {/* Header */}
          <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 w-8 h-8 items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-3xl font-light">‹</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900 flex-1">
              Plan Your Route
            </Text>
          </View>

          {/* Search Input */}
          <View className="px-4 py-3 border-b border-gray-100">
            <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-3">
              <Text className="text-xl mr-2">🔍</Text>
              <TextInput
                placeholder="Where to?"
                value={destination}
                onChangeText={setDestination}
                onSubmitEditing={handleSearch}
                className="flex-1 text-base text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Travel Mode Selector */}
          <View className="px-4 py-3">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
            >
              {TRAVEL_MODES.map((mode) => (
                <TouchableOpacity
                  key={mode.id}
                  onPress={() => setSelectedMode(mode.id)}
                  className={`mr-2 px-4 py-2 rounded-full ${
                    selectedMode === mode.id
                      ? 'bg-primary-600'
                      : 'bg-gray-200'
                  }`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center">
                    <Text className="text-base mr-1">{mode.emoji}</Text>
                    <Text
                      className={`text-sm font-semibold ${
                        selectedMode === mode.id
                          ? 'text-white'
                          : 'text-gray-700'
                      }`}
                    >
                      {mode.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Route Options */}
      {showRoutes && (
        <Animated.View
          entering={SlideInDown.duration(600)}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl"
        >
          <View className="px-6 pt-6 pb-8">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Choose Your Route
            </Text>

            <ScrollView className="mb-4" style={{ maxHeight: 300 }}>
              {MOCK_ROUTES.map((route, index) => (
                <Animated.View
                  key={route.id}
                  entering={FadeInDown.delay(index * 100).duration(600)}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedRoute(route)}
                    className={`mb-3 rounded-2xl p-4 border-2 ${
                      selectedRoute?.id === route.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 bg-white'
                    }`}
                    activeOpacity={0.8}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center flex-1">
                        <View
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: route.color }}
                        />
                        <Text className="text-base font-bold text-gray-900">
                          {route.name}
                        </Text>
                      </View>
                      {selectedRoute?.id === route.id && (
                        <View className="bg-primary-600 rounded-full p-1">
                          <Text className="text-white text-xs">✓</Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-row items-center mb-2">
                      <Text className="text-sm text-gray-600 mr-4">
                        ⏱️ {route.duration}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        📏 {route.distance}
                      </Text>
                    </View>

                    {route.warnings.length > 0 ? (
                      <View className="bg-warning-50 rounded-lg px-3 py-2">
                        {route.warnings.map((warning, idx) => (
                          <Text key={idx} className="text-xs text-warning-700">
                            ⚠️ {warning}
                          </Text>
                        ))}
                      </View>
                    ) : (
                      <View className="bg-success-50 rounded-lg px-3 py-2">
                        <Text className="text-xs text-success-700">
                          ✓ No danger zones on this route
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={handleStartNavigation}
              disabled={!selectedRoute}
              className={`rounded-xl py-4 ${
                selectedRoute ? 'bg-primary-600' : 'bg-gray-300'
              }`}
              activeOpacity={0.8}
            >
              <Text className="text-white text-center font-bold text-lg">
                Start Navigation
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
