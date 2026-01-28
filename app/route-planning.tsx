import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import Animated, { FadeInDown, SlideInDown, SlideInUp, useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
import TipDetailCard from '../components/map/TipDetailCard';
import TipMarker from '../components/map/TipMarker';
import { LocationSearchResult, reverseGeocode } from '../services/nominatim';
import { getMultiModalRoutes, formatDuration, formatDistance, Route, RouteCoordinate } from '../services/locationIQRouting';
import { 
  analyzeRouteSafety, 
  getSafetyRating, 
  aggregateTipsByCategory,
  getAllRouteTips,
  RouteSegment,
  TipCategorySummary
} from '../services/routeSafetyService';
import { familyLocationService, FamilyMember } from '../services/familyLocationService';
import { Tip } from '../services/tipsService';

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
  const [_isSheetExpanded, setIsSheetExpanded] = useState(false);

  // Draggable sheet constants
  const SHEET_MIN_HEIGHT = 240;
  const SHEET_MAX_HEIGHT = 420 + insets.bottom;
  const SHEET_PEEK_HEIGHT = 110; // Higher to avoid phone navigation

  // Animated values for draggable sheet
  const translateY = useSharedValue(SHEET_MAX_HEIGHT - SHEET_MIN_HEIGHT);
  const startY = useSharedValue(0);

  // Family locations
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showFamilyDestinations, setShowFamilyDestinations] = useState(false);

  // Tip visualization states
  const [routeTips, setRouteTips] = useState<Map<string, Tip[]>>(new Map());
  const [selectedRouteTips, setSelectedRouteTips] = useState<Tip[]>([]);
  const [selectedTipForModal, setSelectedTipForModal] = useState<Tip | null>(null);

  // Get current location and family members on mount
  useEffect(() => {
    getCurrentLocation();
    loadFamilyMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pan gesture for draggable sheet
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
      // Return to default position
      else {
        translateY.value = withSpring(SHEET_MAX_HEIGHT - SHEET_MIN_HEIGHT);
        runOnJS(setIsSheetExpanded)(false);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const loadFamilyMembers = async () => {
    try {
      const members = await familyLocationService.getFamilyLocations();
      setFamilyMembers(members);
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

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

      // Get routes using LocationIQ
      const allModeRoutes = await getMultiModalRoutes(start, end, [selectedMode]);
      const modeRoutes = allModeRoutes.get(selectedMode) || [];

      if (modeRoutes.length === 0) {
        throw new Error('No routes found');
      }

      // Add real safety assessment
      type RouteWithSafety = Route & {
        safety: string;
        safetyScore: number;
        warnings: string[];
        color: string;
        dangerZones: number;
        segments: RouteSegment[]; // NEW: Color-coded segments
        tipSummary: TipCategorySummary; // NEW: Tip counts by category
      };

      const newRouteTips = new Map<string, Tip[]>();

      const routesWithSafety: RouteWithSafety[] = await Promise.all(
        modeRoutes.map(async (route) => {
          try {
            // Analyze route safety
            const safetyAnalysis = await analyzeRouteSafety(route.coordinates);
            const safetyRating = getSafetyRating(safetyAnalysis.overallScore);

            // Get all unique tips from this route
            const allTips = getAllRouteTips(safetyAnalysis.segments);
            newRouteTips.set(route.id, allTips);

            // Aggregate tips by category
            const tipSummary = aggregateTipsByCategory(allTips);

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
              segments: safetyAnalysis.segments, // Include segments for colored polylines
              tipSummary, // Include tip summary for route cards
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
              segments: [], // Empty segments on error
              tipSummary: { // Empty tip summary on error
                harassment: 0,
                lighting: 0,
                construction: 0,
                transit: 0,
                safe_haven: 0,
              },
            };
          }
        })
      );

      setRoutes(routesWithSafety as Route[]);
      setRouteTips(newRouteTips); // Save tips for all routes
      setSelectedRoute(routesWithSafety[0] || null);
      
      // Set tips for first route
      if (routesWithSafety[0]) {
        setSelectedRouteTips(newRouteTips.get(routesWithSafety[0].id) || []);
      }
      
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch routes';
      Alert.alert(
        'Error',
        errorMessage.includes('API key')
          ? errorMessage
          : 'Failed to fetch routes. Please check your internet connection and try again.',
      );
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
    setShowFamilyDestinations(false);
  };

  const handleFamilyMemberSelect = async (member: FamilyMember) => {
    try {
      // Reverse geocode family member's location
      const geocoded = await reverseGeocode(member.latitude, member.longitude);

      if (geocoded) {
        setEndLocation({
          ...geocoded,
          name: `${member.full_name}'s Location`,
        });
        setShowFamilyDestinations(false);
      }
    } catch (error) {
      console.error('Error selecting family member:', error);
      Alert.alert('Error', 'Failed to select family member location');
    }
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

        {/* Routes - Color-coded segments for selected, gray for others */}
        {showRoutes &&
          routes.map((route) => {
            const routeWithSegments = route as Route & { segments?: RouteSegment[] };
            const isSelected = route.id === selectedRoute?.id;

            // Helper to validate coordinate
            const isValidCoord = (c: RouteCoordinate) => 
              c && typeof c.latitude === 'number' && !isNaN(c.latitude) &&
              typeof c.longitude === 'number' && !isNaN(c.longitude);

            // If route has segments and is selected, show colored segments
            if (isSelected && routeWithSegments.segments && routeWithSegments.segments.length > 0) {
              return routeWithSegments.segments
                .filter(segment => 
                  segment.coordinates && 
                  segment.coordinates.length >= 2 &&
                  segment.coordinates.every(isValidCoord)
                )
                .map((segment, idx) => (
                  <Polyline
                    key={`${route.id}-segment-${idx}`}
                    coordinates={segment.coordinates}
                    strokeColor={segment.color || '#22C55E'}
                    strokeWidth={5}
                  />
                ));
            }

            // Otherwise show full route in gray or route color
            if (!route.coordinates || 
                route.coordinates.length < 2 || 
                !route.coordinates.every(isValidCoord)) {
              return null;
            }

            return (
              <Polyline
                key={route.id}
                coordinates={route.coordinates}
                strokeColor={isSelected ? (route as Route & { color: string }).color : '#D1D5DB'}
                strokeWidth={isSelected ? 5 : 3}
              />
            );
          })}

        {/* Tip Markers - Only show for selected route */}
        {selectedRoute && Array.isArray(selectedRouteTips) && selectedRouteTips
          .filter(tip => 
            tip && 
            typeof tip.latitude === 'number' && !isNaN(tip.latitude) &&
            typeof tip.longitude === 'number' && !isNaN(tip.longitude)
          )
          .map((tip, idx) => (
            <TipMarker
              key={`tip-${tip.id}-${idx}`}
              tip={tip}
              onPress={(t) => setSelectedTipForModal(t)}
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

            {/* Family Member Quick Destinations */}
            {familyMembers.length > 0 && !endLocation && (
              <View className="mt-3">
                <TouchableOpacity
                  onPress={() => setShowFamilyDestinations(!showFamilyDestinations)}
                  className="flex-row items-center mb-2"
                  activeOpacity={0.7}
                >
                  <MapPin color="#2563eb" size={14} strokeWidth={2} />
                  <Text className="text-xs font-semibold text-primary-600 ml-1">
                    Navigate to Family Member
                  </Text>
                </TouchableOpacity>

                {showFamilyDestinations && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {familyMembers.map((member) => (
                      <TouchableOpacity
                        key={member.user_id}
                        onPress={() => handleFamilyMemberSelect(member)}
                        className="mr-2 bg-primary-50 border border-primary-200 rounded-xl px-3 py-2"
                        activeOpacity={0.7}
                      >
                        <Text className="text-sm font-semibold text-primary-900">
                          {member.full_name}
                        </Text>
                        <Text className="text-xs text-primary-600">
                          {member.is_live ? '🟢 Live' : '⚫ Last known'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
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
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: SHEET_MAX_HEIGHT,
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 5,
            },
            sheetStyle,
          ]}
        >
          {/* Drag Handle */}
          <GestureDetector gesture={panGesture}>
            <Animated.View className="items-center py-3 bg-transparent w-full">
              <View className="w-12 h-1 bg-neutral-300 rounded-full" />
            </Animated.View>
          </GestureDetector>

          <View className="px-6 flex-1" style={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}>
            <Text className="text-xl font-bold text-neutral-900 mb-4">Choose Your Route</Text>

            <ScrollView 
              className="flex-1 mb-4" 
              showsVerticalScrollIndicator={false}
            >
              {routes.map((route, index) => {
                const routeWithSafety = route as Route & { color: string; warnings?: string[] };
                return (
                  <Animated.View
                    key={route.id}
                    entering={FadeInDown.delay(index * 100).duration(600)}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedRoute(route);
                        setSelectedRouteTips(routeTips.get(route.id) || []);
                      }}
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

                      {/* Tip Summary - NEW */}
                      {(() => {
                        const routeWithTips = route as Route & { tipSummary?: TipCategorySummary };
                        const tipSummary = routeWithTips.tipSummary;
                        
                        if (!tipSummary) return null;
                        
                        const hasTips = tipSummary.harassment > 0 || 
                                       tipSummary.lighting > 0 || 
                                       tipSummary.construction > 0 || 
                                       tipSummary.transit > 0 ||
                                       tipSummary.safe_haven > 0;
                        
                        if (!hasTips) return null;

                        return (
                          <View className="mb-2 bg-neutral-50 rounded-lg px-3 py-2">
                            <Text className="text-xs font-semibold text-neutral-700 mb-1.5">
                              Safety Info:
                            </Text>
                            <View className="flex-row flex-wrap">
                              {tipSummary.harassment > 0 && (
                                <View className="flex-row items-center mr-3 mb-1">
                                  <AlertTriangle color="#DC2626" size={12} strokeWidth={2} />
                                  <Text className="text-xs text-danger-700 ml-1">
                                    {tipSummary.harassment} harassment
                                  </Text>
                                </View>
                              )}
                              {tipSummary.lighting > 0 && (
                                <View className="flex-row items-center mr-3 mb-1">
                                  <AlertTriangle color="#EAB308" size={12} strokeWidth={2} />
                                  <Text className="text-xs text-warning-700 ml-1">
                                    {tipSummary.lighting} poor lighting
                                  </Text>
                                </View>
                              )}
                              {tipSummary.construction > 0 && (
                                <View className="flex-row items-center mr-3 mb-1">
                                  <AlertTriangle color="#F97316" size={12} strokeWidth={2} />
                                  <Text className="text-xs text-orange-700 ml-1">
                                    {tipSummary.construction} construction
                                  </Text>
                                </View>
                              )}
                              {tipSummary.transit > 0 && (
                                <View className="flex-row items-center mr-3 mb-1">
                                  <Bus color="#3B82F6" size={12} strokeWidth={2} />
                                  <Text className="text-xs text-blue-700 ml-1">
                                    {tipSummary.transit} transit issue{tipSummary.transit > 1 ? 's' : ''}
                                  </Text>
                                </View>
                              )}
                              {tipSummary.safe_haven > 0 && (
                                <View className="flex-row items-center mr-3 mb-1">
                                  <CheckCircle color="#22C55E" size={12} strokeWidth={2} />
                                  <Text className="text-xs text-success-700 ml-1">
                                    {tipSummary.safe_haven} safe haven{tipSummary.safe_haven > 1 ? 's' : ''}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })()}

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
              className={`rounded-xl py-5 ${selectedRoute ? 'bg-primary-600' : 'bg-neutral-300'
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

      {/* Selected Tip Detail Card Modal */}
      {selectedTipForModal && (
        <>
          {/* Backdrop - tap to close */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setSelectedTipForModal(null)}
            className="absolute left-0 right-0 top-0 bottom-0"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 100 }}
          />
          
          {/* Modal Content */}
          <View 
            className="absolute left-0 right-0 top-0 bottom-0 justify-center items-center"
            pointerEvents="box-none"
            style={{ zIndex: 101 }}
          >
            <Animated.View
              entering={SlideInUp.duration(400)}
              className="w-11/12 max-w-lg"
              style={{ width: Dimensions.get('window').width * 0.92 }}
            >
              <TipDetailCard
                tip={selectedTipForModal}
                onClose={() => setSelectedTipForModal(null)}
              />
            </Animated.View>
          </View>
        </>
      )}
    </View>
  );
}
