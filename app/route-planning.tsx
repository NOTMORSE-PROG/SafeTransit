import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import Animated, { FadeInDown, SlideInDown } from 'react-native-reanimated';
import * as ExpoLocation from 'expo-location';
import {
  PersonStanding,
  Car,
  Bus,
  ChevronLeft,
  Clock,
  Ruler,
  AlertTriangle,
  CheckCircle,
  Navigation,
  MapPin,
  Check,
} from 'lucide-react-native';

import LocationSearchInput from '../components/LocationSearchInput';
import NavigationConfirmModal from '../components/NavigationConfirmModal';
import { LocationSearchResult, reverseGeocode } from '../services/nominatim';
import { getMultiModalRoutes, formatDuration, formatDistance, Route } from '../services/osrm';
import { analyzeRouteSafety, getSafetyRating } from '../services/routeSafetyService';

const TRAVEL_MODES = [
  { id: 'walk', label: 'Walk', icon: 'PersonStanding' },
  { id: 'drive', label: 'Drive', icon: 'Car' },
  { id: 'transit', label: 'Transit', icon: 'Bus' },
];

// Manila default region
const MANILA_REGION: Region = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function RoutePlanning() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Location states
  const [currentLocation, setCurrentLocation] = useState<LocationSearchResult | null>(null);
  const [startLocation, setStartLocation] = useState<LocationSearchResult | null>(null);
  const [endLocation, setEndLocation] = useState<LocationSearchResult | null>(null);
  const [useCurrentAsStart, setUseCurrentAsStart] = useState(true);

  // Route states
  const [selectedMode, setSelectedMode] = useState<'walk' | 'drive' | 'transit'>('walk');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

  // UI states
  const [showRoutes, setShowRoutes] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>(MANILA_REGION);
  const [showNavigationModal, setShowNavigationModal] = useState(false);

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch routes when both locations and mode are selected
  useEffect(() => {
    if (startLocation && endLocation) {
      fetchRoutes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startLocation, endLocation, selectedMode]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use this feature.'
        );
        return;
      }

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      const geocoded = await reverseGeocode(latitude, longitude);

      if (geocoded) {
        setCurrentLocation(geocoded);
        if (useCurrentAsStart) {
          setStartLocation(geocoded);
        }

        // Center map on current location
        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const fetchRoutes = async () => {
    if (!startLocation || !endLocation) return;

    setIsLoadingRoutes(true);
    setShowRoutes(false);

    try {
      const start = {
        latitude: startLocation.latitude,
        longitude: startLocation.longitude,
      };

      const end = {
        latitude: endLocation.latitude,
        longitude: endLocation.longitude,
      };

      // Get routes for all modes
      const allModeRoutes = await getMultiModalRoutes(start, end, [selectedMode]);
      const modeRoutes = allModeRoutes.get(selectedMode) || [];

      // Add real safety assessment
      type RouteWithSafety = Route & {
        safety: string;
        safetyScore: number;
        warnings: string[];
        color: string;
        dangerZones: number;
      };

      const routesWithSafety: RouteWithSafety[] = await Promise.all(
        modeRoutes.map(async (route) => {
          try {
            // Analyze route safety
            const safetyAnalysis = await analyzeRouteSafety(route.coordinates);
            const safetyRating = getSafetyRating(safetyAnalysis.overallScore);

            // Generate warnings based on danger zones
            const warnings: string[] = [];
            if (safetyAnalysis.dangerZones > 0) {
              warnings.push(`Passes through ${safetyAnalysis.dangerZones} caution zone${safetyAnalysis.dangerZones > 1 ? 's' : ''}`);
            }

            return {
              ...route,
              safety: safetyRating.text,
              safetyScore: safetyAnalysis.overallScore,
              warnings,
              color: safetyRating.color,
              dangerZones: safetyAnalysis.dangerZones,
            };
          } catch (error) {
            console.error('Error analyzing route safety:', error);
            // Fallback to default values on error
            return {
              ...route,
              safety: 'Unknown',
              safetyScore: 50,
              warnings: [],
              color: '#9CA3AF',
              dangerZones: 0,
            };
          }
        })
      );

      setRoutes(routesWithSafety as Route[]);
      setSelectedRoute(routesWithSafety[0] || null);
      setShowRoutes(true);

      // Adjust map to show both points
      const midLat = (start.latitude + end.latitude) / 2;
      const midLon = (start.longitude + end.longitude) / 2;
      const latDelta = Math.abs(start.latitude - end.latitude) * 2.5;
      const lonDelta = Math.abs(start.longitude - end.longitude) * 2.5;

      setMapRegion({
        latitude: midLat,
        longitude: midLon,
        latitudeDelta: Math.max(latDelta, 0.02),
        longitudeDelta: Math.max(lonDelta, 0.02),
      });
    } catch (error) {
      console.error('Error fetching routes:', error);
      Alert.alert('Error', 'Failed to fetch routes. Please try again.');
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const handleStartLocationSelect = (location: LocationSearchResult) => {
    setStartLocation(location);
    setUseCurrentAsStart(false);
  };

  const handleEndLocationSelect = (location: LocationSearchResult) => {
    setEndLocation(location);
  };

  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      setStartLocation(currentLocation);
      setUseCurrentAsStart(true);
    } else {
      getCurrentLocation();
    }
  };

  const handleStartNavigation = () => {
    if (!selectedRoute) return;
    setShowNavigationModal(true);
  };

  const handleConfirmNavigation = () => {
    setShowNavigationModal(false);
    // In a real app, this would start turn-by-turn navigation
    router.back();
  };

  const effectiveStartLocation = useCurrentAsStart ? currentLocation : startLocation;

  return (
    <View className="flex-1 bg-white">
      {/* Map */}
      <MapView
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        region={mapRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Starting Point Marker */}
        {effectiveStartLocation && (
          <Marker
            coordinate={{
              latitude: effectiveStartLocation.latitude,
              longitude: effectiveStartLocation.longitude,
            }}
            title={effectiveStartLocation.name}
            description={effectiveStartLocation.address}
          >
            <View className="bg-primary-600 w-8 h-8 rounded-full border-2 border-white items-center justify-center">
              <Navigation color="#ffffff" size={16} strokeWidth={2.5} />
            </View>
          </Marker>
        )}

        {/* Destination Marker */}
        {endLocation && (
          <Marker
            coordinate={{
              latitude: endLocation.latitude,
              longitude: endLocation.longitude,
            }}
            title={endLocation.name}
            description={endLocation.address}
          >
            <View className="bg-danger-600 w-10 h-10 rounded-full items-center justify-center">
              <MapPin color="#ffffff" size={24} strokeWidth={2} />
            </View>
          </Marker>
        )}

        {/* Routes */}
        {showRoutes &&
          routes.map((route) => (
            <Polyline
              key={route.id}
              coordinates={route.coordinates}
              strokeColor={route.id === selectedRoute?.id ? (route as Route & { color: string }).color : '#D1D5DB'}
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

          {/* Search Inputs */}
          <View className="px-4 py-3 border-b border-neutral-100">
            {/* From Input */}
            <View className="mb-3">
              <LocationSearchInput
                placeholder="Where from?"
                value={effectiveStartLocation?.name || ''}
                onLocationSelect={handleStartLocationSelect}
                icon="start"
                showCurrentLocation={!useCurrentAsStart}
                onUseCurrentLocation={handleUseCurrentLocation}
              />
            </View>

            {/* To Input */}
            <LocationSearchInput
              placeholder="Where to?"
              value={endLocation?.name || ''}
              onLocationSelect={handleEndLocationSelect}
              icon="end"
              autoFocus={false}
            />
          </View>

          {/* Travel Mode Selector */}
          <View className="px-4 py-3">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {TRAVEL_MODES.map((mode) => {
                const IconComponent =
                  mode.icon === 'PersonStanding'
                    ? PersonStanding
                    : mode.icon === 'Car'
                      ? Car
                      : Bus;
                return (
                  <TouchableOpacity
                    key={mode.id}
                    onPress={() => setSelectedMode(mode.id as 'walk' | 'drive' | 'transit')}
                    className={`mr-2 px-4 py-2 rounded-full ${selectedMode === mode.id ? 'bg-primary-600' : 'bg-neutral-200'
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
                        className={`text-sm font-semibold ml-1.5 ${selectedMode === mode.id ? 'text-white' : 'text-neutral-700'
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

          {/* Loading Indicator */}
          {isLoadingRoutes && (
            <View className="px-4 py-3 border-t border-neutral-100">
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#2563eb" />
                <Text className="text-sm text-neutral-600 ml-2">Finding best routes...</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Route Options */}
      {showRoutes && routes.length > 0 && (
        <Animated.View
          entering={SlideInDown.duration(600)}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl"
        >
          <View className="px-6 pt-6" style={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}>
            <Text className="text-xl font-bold text-neutral-900 mb-4">Choose Your Route</Text>

            <ScrollView className="mb-4" style={{ maxHeight: 300 }}>
              {routes.map((route, index) => {
                const routeWithSafety = route as Route & { color: string; warnings?: string[] };
                return (
                  <Animated.View
                    key={route.id}
                    entering={FadeInDown.delay(index * 100).duration(600)}
                  >
                    <TouchableOpacity
                      onPress={() => setSelectedRoute(route)}
                      className={`mb-3 rounded-2xl p-4 border-2 ${selectedRoute?.id === route.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-neutral-200 bg-white'
                        }`}
                      activeOpacity={0.8}
                      accessible={true}
                      accessibilityLabel={`${route.name}, ${formatDuration(route.duration)}, ${formatDistance(route.distance)}`}
                      accessibilityRole="button"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center flex-1">
                          <View
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: routeWithSafety.color }}
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
                            {formatDuration(route.duration)}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ruler color="#4b5563" size={16} strokeWidth={2} />
                          <Text className="text-sm text-neutral-600 ml-1.5">
                            {formatDistance(route.distance)}
                          </Text>
                        </View>
                      </View>

                      {routeWithSafety.warnings && routeWithSafety.warnings.length > 0 ? (
                        <View className="bg-warning-50 rounded-lg px-3 py-2">
                          {routeWithSafety.warnings.map((warning: string, idx: number) => (
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
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={handleStartNavigation}
              disabled={!selectedRoute}
              className={`rounded-xl py-4 ${selectedRoute ? 'bg-primary-600' : 'bg-neutral-300'
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

      {/* Navigation Confirmation Modal */}
      {selectedRoute && (
        <NavigationConfirmModal
          visible={showNavigationModal}
          routeName={selectedRoute.name}
          duration={formatDuration(selectedRoute.duration)}
          distance={formatDistance(selectedRoute.distance)}
          onClose={() => setShowNavigationModal(false)}
          onConfirm={handleConfirmNavigation}
        />
      )}
    </View>
  );
}
