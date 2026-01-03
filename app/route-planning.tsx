import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import Animated, { FadeInDown, SlideInDown } from 'react-native-reanimated';
import { PersonStanding, Car, Bus, ChevronLeft, Search, Clock, Ruler, AlertTriangle, CheckCircle, Navigation, MapPin, Check } from 'lucide-react-native';

const TRAVEL_MODES = [
  { id: 'walk', label: 'Walk', icon: 'PersonStanding' },
  { id: 'drive', label: 'Drive', icon: 'Car' },
  { id: 'transit', label: 'Transit', icon: 'Bus' }
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
          <View className="bg-primary-600 w-8 h-8 rounded-full border-2 border-white items-center justify-center">
            <Navigation color="#ffffff" size={16} strokeWidth={2.5} />
          </View>
        </Marker>

        {/* Destination */}
        {showRoutes && (
          <Marker
            coordinate={{ latitude: 14.6025, longitude: 120.9872 }}
            title="Destination"
          >
            <View className="bg-danger-600 w-10 h-10 rounded-full items-center justify-center">
              <MapPin color="#ffffff" size={24} strokeWidth={2} />
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
          <View className="flex-row items-center px-4 py-3 border-b border-neutral-100">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 w-8 h-8 items-center justify-center"
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <ChevronLeft color="#111827" size={28} strokeWidth={2} />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-neutral-900 flex-1">
              Plan Your Route
            </Text>
          </View>

          {/* Search Input */}
          <View className="px-4 py-3 border-b border-neutral-100">
            <View className="flex-row items-center bg-neutral-100 rounded-xl px-3 py-3">
              <Search color="#6b7280" size={20} strokeWidth={2} />
              <TextInput
                placeholder="Where to?"
                value={destination}
                onChangeText={setDestination}
                onSubmitEditing={handleSearch}
                className="flex-1 text-base text-neutral-900 ml-2"
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
              {TRAVEL_MODES.map((mode) => {
                const IconComponent = mode.icon === 'PersonStanding' ? PersonStanding :
                                     mode.icon === 'Car' ? Car : Bus;
                return (
                  <TouchableOpacity
                    key={mode.id}
                    onPress={() => setSelectedMode(mode.id)}
                    className={`mr-2 px-4 py-2 rounded-full ${
                      selectedMode === mode.id
                        ? 'bg-primary-600'
                        : 'bg-neutral-200'
                    }`}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center">
                      <IconComponent
                        color={selectedMode === mode.id ? '#ffffff' : '#374151'}
                        size={18}
                        strokeWidth={2}
                      />
                      <Text
                        className={`text-sm font-semibold ml-1.5 ${
                          selectedMode === mode.id
                            ? 'text-white'
                            : 'text-neutral-700'
                        }`}
                      >
                        {mode.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
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
            <Text className="text-xl font-bold text-neutral-900 mb-4">
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
                        : 'border-neutral-200 bg-white'
                    }`}
                    activeOpacity={0.8}
                    accessible={true}
                    accessibilityLabel={`${route.name}, ${route.duration}, ${route.distance}`}
                    accessibilityRole="button"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center flex-1">
                        <View
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: route.color }}
                        />
                        <Text className="text-base font-bold text-neutral-900">
                          {route.name}
                        </Text>
                      </View>
                      {selectedRoute?.id === route.id && (
                        <View className="bg-primary-600 rounded-full p-1.5">
                          <Check color="#ffffff" size={12} strokeWidth={3} />
                        </View>
                      )}
                    </View>

                    <View className="flex-row items-center mb-2">
                      <View className="flex-row items-center mr-4">
                        <Clock color="#4b5563" size={16} strokeWidth={2} />
                        <Text className="text-sm text-neutral-600 ml-1.5">
                          {route.duration}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ruler color="#4b5563" size={16} strokeWidth={2} />
                        <Text className="text-sm text-neutral-600 ml-1.5">
                          {route.distance}
                        </Text>
                      </View>
                    </View>

                    {route.warnings.length > 0 ? (
                      <View className="bg-warning-50 rounded-lg px-3 py-2">
                        {route.warnings.map((warning, idx) => (
                          <View key={idx} className="flex-row items-center">
                            <AlertTriangle color="#b45309" size={14} strokeWidth={2} />
                            <Text className="text-xs text-warning-700 ml-1.5 flex-1">
                              {warning}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View className="bg-success-50 rounded-lg px-3 py-2">
                        <View className="flex-row items-center">
                          <CheckCircle color="#15803d" size={14} strokeWidth={2} />
                          <Text className="text-xs text-success-700 ml-1.5">
                            No danger zones on this route
                          </Text>
                        </View>
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
                selectedRoute ? 'bg-primary-600' : 'bg-neutral-300'
              }`}
              activeOpacity={0.8}
              accessible={true}
              accessibilityLabel="Start navigation"
              accessibilityRole="button"
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
