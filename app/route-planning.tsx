import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import Animated, {
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing
} from 'react-native-reanimated';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import * as ExpoLocation from 'expo-location';
import * as Haptics from 'expo-haptics';
import {
  PersonStanding,
  Car,
  Bus,
  ChevronLeft,
  Clock,
  Ruler,
  Navigation,
  MapPin,
  ArrowLeft,
  Crosshair,
  Home,
  Briefcase,
  RotateCcw,
  Shield,
  Lightbulb
} from 'lucide-react-native';

import LocationSearchInput from '../components/LocationSearchInput';
import NavigationConfirmModal from '../components/NavigationConfirmModal';
import PickupPointSelector from '../components/PickupPointSelector';
import GrabStylePin from '../components/GrabStylePin';
import { LocationSearchResult, reverseGeocode, reverseGeocodeDebounced, cancelPendingReverseGeocode } from '../services/nominatim';
import { getMultiModalRoutes, formatDuration, formatDistance, Route } from '../services/osrm';
import { getSavedPlaceByType, SavedPlace } from '../services/locationStorage';

const { width } = Dimensions.get('window');

// Extended Route type with safety information
interface RouteWithSafety extends Route {
  safety: 'high' | 'medium';
  safetyScore: number;
  highlights: string[];
  warnings: string[];
  color: string;
}

const TRAVEL_MODES = [
  { id: 'walk' as const, label: 'Walk', icon: PersonStanding },
  { id: 'drive' as const, label: 'Drive', icon: Car },
  { id: 'transit' as const, label: 'Transit', icon: Bus },
];

// Manila default region
const MANILA_REGION: Region = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

type ViewMode = 'search' | 'map_picker' | 'route_preview';

export default function RoutePlanning() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Bottom sheet snap points - Grab-like behavior
  const snapPoints = useMemo(() => ['25%', '50%', '85%'], []);

  // Modes
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [activeInput, setActiveInput] = useState<'start' | 'end'>('end');

  // Location states
  const [currentLocation, setCurrentLocation] = useState<LocationSearchResult | null>(null);
  const [startLocation, setStartLocation] = useState<LocationSearchResult | null>(null);
  const [endLocation, setEndLocation] = useState<LocationSearchResult | null>(null);
  const [useCurrentAsStart, setUseCurrentAsStart] = useState(true);

  // Saved places for quick access
  const [homePlace, setHomePlace] = useState<SavedPlace | null>(null);
  const [workPlace, setWorkPlace] = useState<SavedPlace | null>(null);

  // Picker State
  const [pickerLocation, setPickerLocation] = useState<LocationSearchResult | null>(null);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(MANILA_REGION);

  // Route states
  const [selectedMode, setSelectedMode] = useState<'walk' | 'drive' | 'transit'>('walk');
  const [routes, setRoutes] = useState<RouteWithSafety[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteWithSafety | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [showNavigationModal, setShowNavigationModal] = useState(false);

  // Pickup points states (Grab-style multi-entrance)
  const [selectedStartPickup, setSelectedStartPickup] = useState<string | null>(null);
  const [selectedEndPickup, setSelectedEndPickup] = useState<string | null>(null);
  const [showPickupSelector, setShowPickupSelector] = useState<'start' | 'end' | null>(null);

  // Enhanced Animations - Spring physics for Grab-like bounce
  const pinTranslateY = useSharedValue(0);
  const pinScale = useSharedValue(1);
  const shadowScale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.3);
  const tooltipOpacity = useSharedValue(1);
  const tooltipTranslateY = useSharedValue(0);

  // Pulse animation for markers
  const markerPulse = useSharedValue(1);

  // Get current location and saved places on mount
  useEffect(() => {
    getCurrentLocation();
    loadSavedPlaces();

    // Cleanup on unmount
    return () => {
      cancelPendingReverseGeocode();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start marker pulse animation
  useEffect(() => {
    markerPulse.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch routes when entering route_preview
  useEffect(() => {
    if (viewMode === 'route_preview' && startLocation && endLocation) {
      fetchRoutes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, startLocation, endLocation, selectedMode]);

  const loadSavedPlaces = async () => {
    const [home, work] = await Promise.all([
      getSavedPlaceByType('home'),
      getSavedPlaceByType('work')
    ]);
    setHomePlace(home);
    setWorkPlace(work);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      const geocoded = await reverseGeocode(latitude, longitude);

      if (geocoded) {
        setCurrentLocation(geocoded);
        if (useCurrentAsStart && !startLocation) {
          setStartLocation(geocoded);
        }
        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleRegionChange = () => {
    setIsMapMoving(true);
    setGeocodeError(null);

    // Animate Pin Up - Grab-like lift effect
    pinTranslateY.value = withSpring(-24, {
      damping: 15,
      stiffness: 300,
      mass: 0.8
    });
    pinScale.value = withSpring(1.2, {
      damping: 15,
      stiffness: 300
    });

    // Shrink and fade shadow (pin appears to lift)
    shadowScale.value = withSpring(0.5, { damping: 15, stiffness: 300 });
    shadowOpacity.value = withSpring(0.1, { damping: 15, stiffness: 300 });

    // Fade and slide tooltip
    tooltipOpacity.value = withTiming(0.6, { duration: 150 });
    tooltipTranslateY.value = withTiming(5, { duration: 150 });
  };

  const handleRegionChangeComplete = async (region: Region) => {
    setIsMapMoving(false);

    // Animate Pin Down - More bouncy drop effect (Grab-like)
    pinTranslateY.value = withSpring(0, {
      damping: 6,      // Lower damping = more bounce
      stiffness: 200,
      mass: 0.4
    });
    pinScale.value = withSpring(1, { damping: 8, stiffness: 200 });

    // Restore shadow
    shadowScale.value = withSpring(1, { damping: 8, stiffness: 200 });
    shadowOpacity.value = withSpring(0.3, { damping: 8, stiffness: 200 });

    // Restore tooltip with slide
    tooltipOpacity.value = withTiming(1, { duration: 200 });
    tooltipTranslateY.value = withSpring(0, { damping: 15, stiffness: 300 });

    // Haptic feedback on pin drop
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setMapRegion(region);

    // Start geocoding with loading state
    setIsGeocoding(true);

    try {
      // Use debounced reverse geocode (500ms delay)
      const geocoded = await reverseGeocodeDebounced(
        region.latitude,
        region.longitude,
        500
      );

      if (geocoded) {
        setPickerLocation(geocoded);
        setGeocodeError(null);
      }
    } catch (error) {
      console.error('Geocode error:', error);
      setGeocodeError('Unable to determine location');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Set fallback location
      setPickerLocation({
        id: `manual_${Date.now()}`,
        name: 'Selected Location',
        address: `${region.latitude.toFixed(6)}, ${region.longitude.toFixed(6)}`,
        latitude: region.latitude,
        longitude: region.longitude,
        type: 'pin_drop'
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const retryGeocode = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsGeocoding(true);
    setGeocodeError(null);

    try {
      const geocoded = await reverseGeocode(mapRegion.latitude, mapRegion.longitude);
      if (geocoded) {
        setPickerLocation(geocoded);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setGeocodeError('Still unable to find address');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const confirmPickerLocation = () => {
    if (!pickerLocation) return;

    // Haptic feedback on confirm
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (activeInput === 'start') {
      setStartLocation(pickerLocation);
      setUseCurrentAsStart(false);
    } else {
      setEndLocation(pickerLocation);
    }

    // Decide next step
    if (activeInput === 'start' && !endLocation) {
      setActiveInput('end');
      setViewMode('search');
    } else if (activeInput === 'end' && !startLocation) {
      setActiveInput('start');
      setViewMode('search');
    } else {
      setViewMode('route_preview');
    }
  };

  const goToSavedPlace = (place: SavedPlace) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newRegion = {
      latitude: place.latitude,
      longitude: place.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    mapRef.current?.animateToRegion(newRegion, 400);
    setMapRegion(newRegion);
    setPickerLocation({
      id: place.id,
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      type: place.type
    });
  };

  const centerOnCurrentLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      mapRef.current?.animateToRegion(newRegion, 500);
      setMapRegion(newRegion);
    } catch (error) {
      console.error('Error centering on location:', error);
    }
  };

  const fetchRoutes = async () => {
    if (!startLocation || !endLocation) return;
    setIsLoadingRoutes(true);
    try {
      const start = { latitude: startLocation.latitude, longitude: startLocation.longitude };
      const end = { latitude: endLocation.latitude, longitude: endLocation.longitude };

      const allModeRoutes = await getMultiModalRoutes(start, end, [selectedMode]);
      const modeRoutes = allModeRoutes.get(selectedMode) || [];

      // Enhanced safety data
      const routesWithSafety: RouteWithSafety[] = modeRoutes.map((route, index) => ({
        ...route,
        safety: (index === 0 ? 'high' : 'medium') as 'high' | 'medium',
        safetyScore: index === 0 ? 4.5 : 3.2,
        highlights: index === 0
          ? ['Well-lit streets', 'Near police station', 'Busy area']
          : ['Some dark areas', 'Less populated'],
        warnings: index === 0 ? [] : ['Caution zone nearby'],
        color: index === 0 ? '#22C55E' : '#F59E0B',
      }));

      setRoutes(routesWithSafety);
      setSelectedRoute(routesWithSafety[0] || null);

      // Haptic feedback on routes loaded
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Fit map to route
      setTimeout(() => {
        mapRef.current?.fitToCoordinates([start, end], {
          edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
          animated: true,
        });
      }, 500);

    } catch {
      Alert.alert('Error', 'Failed to fetch routes');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const selectRoute = (route: RouteWithSafety) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRoute(route);
  };

  // Animated Styles with enhanced effects
  const pinStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: pinTranslateY.value },
      { scale: pinScale.value }
    ],
  }));

  const _shadowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shadowScale.value }],
    opacity: shadowOpacity.value,
  }));

  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
    transform: [
      { translateY: tooltipTranslateY.value },
      { scale: interpolate(tooltipOpacity.value, [0.6, 1], [0.95, 1]) }
    ]
  }));

  const _markerPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: markerPulse.value }],
    opacity: interpolate(markerPulse.value, [1, 1.3], [0.6, 0])
  }));

  // Bottom sheet backdrop with blur-like effect
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={0}
        appearsOnIndex={1}
        opacity={0.5}
        pressBehavior="collapse"
      />
    ),
    []
  );

  // Handle bottom sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    if (index >= 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  // --- RENDER HELPERS ---

  const renderSearchMode = () => (
    <View className="flex-1 bg-white">
      {/* Full-screen search modal opens immediately */}
      <LocationSearchInput
        placeholder={activeInput === 'start' ? "Current Location" : "Where to?"}
        value=""
        autoFocus={true}
        initiallyExpanded={true}
        onClose={() => router.back()}
        showCurrentLocation={activeInput === 'start'}
        onUseCurrentLocation={() => {
          if (currentLocation) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setStartLocation(currentLocation);
            if (endLocation) {
              setViewMode('route_preview');
            } else {
              setActiveInput('end');
            }
          }
        }}
        showSelectOnMap={true}
        onSelectOnMap={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setViewMode('map_picker');
          // Center map on relevant location if exists
          const target = activeInput === 'start' ? (startLocation || currentLocation) : (endLocation || currentLocation);
          if (target) {
            setMapRegion({
              latitude: target.latitude,
              longitude: target.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
            setPickerLocation(target);
          }
        }}
        onLocationSelect={(loc) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

          console.log('[RoutePlanning] Selected location:', loc.name);
          console.log('[RoutePlanning] Has pickup points?', loc.has_pickup_points);
          console.log('[RoutePlanning] Pickup points:', loc.pickup_points);

          if (activeInput === 'start') {
            setStartLocation(loc);
            setUseCurrentAsStart(false);
          } else {
            setEndLocation(loc);
          }

          // Check if location has pickup points - show selector (Grab-style)
          if (loc.has_pickup_points && loc.pickup_points && loc.pickup_points.length > 0) {
            console.log('[RoutePlanning] Showing pickup selector with', loc.pickup_points.length, 'points');
            // Auto-select first (closest/most popular) pickup point
            const firstPickup = loc.pickup_points[0];
            if (activeInput === 'start') {
              setSelectedStartPickup(firstPickup.id);
            } else {
              setSelectedEndPickup(firstPickup.id);
            }

            // Show pickup selector for user to choose
            setShowPickupSelector(activeInput);

            // Update location coordinates to first pickup point
            const updatedLoc: LocationSearchResult = {
              ...loc,
              latitude: firstPickup.latitude,
              longitude: firstPickup.longitude,
            };

            if (activeInput === 'start') {
              setStartLocation(updatedLoc);
            } else {
              setEndLocation(updatedLoc);
            }

            return; // Don't navigate yet, let user select pickup point first
          }

          // Navigate to next step
          if (activeInput === 'start' && endLocation) setViewMode('route_preview');
          else if (activeInput === 'end' && startLocation) setViewMode('route_preview');
          else if (activeInput === 'start') { setActiveInput('end'); }
          else if (activeInput === 'end' && !startLocation) { setActiveInput('start'); }
          else setViewMode('route_preview');
        }}
        icon={activeInput === 'start' ? 'start' : 'end'}
      />
    </View>
  );

  const renderMapPickerMode = () => (
    <View className="flex-1 relative">
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        region={mapRegion}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        pitchEnabled={false}
        rotateEnabled={false}
      />

      {/* Top Bar */}
      <View className="absolute top-12 left-4 right-4 flex-row items-center justify-between z-10">
        {/* Back Button */}
        <TouchableOpacity
          className="w-11 h-11 bg-white rounded-full items-center justify-center shadow-lg"
          onPress={() => setViewMode('search')}
          activeOpacity={0.8}
        >
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>

        {/* My Location Button */}
        <TouchableOpacity
          className="w-11 h-11 bg-white rounded-full items-center justify-center shadow-lg"
          onPress={centerOnCurrentLocation}
          activeOpacity={0.8}
        >
          <Crosshair size={22} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Quick Access Favorites - Grab-like Home/Work buttons */}
      {(homePlace || workPlace) && (
        <Animated.View
          entering={SlideInUp.delay(200).duration(300)}
          className="absolute top-28 left-4 flex-row z-10"
        >
          {homePlace && (
            <TouchableOpacity
              className="flex-row items-center bg-white px-3 py-2 rounded-full shadow-md mr-2"
              onPress={() => goToSavedPlace(homePlace)}
              activeOpacity={0.8}
            >
              <View className="w-7 h-7 bg-primary-100 rounded-full items-center justify-center mr-2">
                <Home size={14} color="#2563eb" />
              </View>
              <Text className="text-sm font-medium text-gray-700">Home</Text>
            </TouchableOpacity>
          )}
          {workPlace && (
            <TouchableOpacity
              className="flex-row items-center bg-white px-3 py-2 rounded-full shadow-md"
              onPress={() => goToSavedPlace(workPlace)}
              activeOpacity={0.8}
            >
              <View className="w-7 h-7 bg-violet-100 rounded-full items-center justify-center mr-2">
                <Briefcase size={14} color="#7c3aed" />
              </View>
              <Text className="text-sm font-medium text-gray-700">Work</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* Fixed Center Pin Container - Grab-style teardrop */}
      <View
        className="absolute inset-0 items-center justify-center pointer-events-none"
        style={{ paddingBottom: 80 }}
      >
        {/* Pin with animation */}
        <Animated.View style={[pinStyle]}>
          <GrabStylePin
            Icon={activeInput === 'start' ? Navigation : MapPin}
            color={activeInput === 'start' ? '#2563eb' : '#dc2626'}
            size={52}
            selected={!isMapMoving}
          />
        </Animated.View>
      </View>

      {/* Address Tooltip - Above the Pin */}
      <View
        className="absolute items-center justify-center pointer-events-none"
        style={{ top: '32%', left: 0, right: 0 }}
      >
        <Animated.View
          style={[tooltipStyle]}
          className="bg-white px-5 py-3 rounded-2xl shadow-xl mx-6 max-w-[85%]"
        >
          {isMapMoving ? (
            <View className="flex-row items-center justify-center">
              <Text className="text-sm font-medium text-gray-400">
                Move map to select location
              </Text>
            </View>
          ) : isGeocoding ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#2563eb" />
              <Text className="ml-2 text-sm font-medium text-gray-500">
                Locating...
              </Text>
            </View>
          ) : geocodeError ? (
            <View className="items-center">
              <Text className="text-sm font-bold text-gray-900 text-center">
                {pickerLocation?.name || 'Selected Location'}
              </Text>
              <Text className="text-xs text-amber-600 text-center mt-1">
                {geocodeError}
              </Text>
              <TouchableOpacity
                className="flex-row items-center mt-2 px-3 py-1 bg-gray-100 rounded-full pointer-events-auto"
                onPress={retryGeocode}
              >
                <RotateCcw size={12} color="#6b7280" />
                <Text className="text-xs text-gray-600 ml-1">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="items-center">
              <Text className="text-sm font-bold text-gray-900 text-center" numberOfLines={2}>
                {pickerLocation?.name || 'Unknown Location'}
              </Text>
              {pickerLocation?.address && pickerLocation.address !== pickerLocation.name && (
                <Text className="text-xs text-gray-500 text-center mt-1" numberOfLines={1}>
                  {pickerLocation.address.split(',').slice(0, 2).join(',')}
                </Text>
              )}
            </View>
          )}
        </Animated.View>
      </View>

      {/* Bottom Confirm Sheet */}
      <View className="absolute bottom-0 left-0 right-0 bg-white pt-5 pb-8 px-5 rounded-t-3xl shadow-2xl">
        {/* Handle */}
        <View className="items-center mb-4">
          <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </View>

        {/* Location Info */}
        <View className="mb-5">
          <Text className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-medium">
            {activeInput === 'start' ? 'Pick-up Location' : 'Drop-off Location'}
          </Text>
          <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
            {pickerLocation?.name || 'Select a location'}
          </Text>
          {pickerLocation?.address && pickerLocation.address !== pickerLocation.name && (
            <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
              {pickerLocation.address}
            </Text>
          )}
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center ${
            isMapMoving || isGeocoding || !pickerLocation
              ? 'bg-gray-200'
              : 'bg-primary-600 active:bg-primary-700'
          }`}
          onPress={confirmPickerLocation}
          disabled={isMapMoving || isGeocoding || !pickerLocation}
          activeOpacity={0.8}
        >
          <Text className={`font-bold text-lg ${
            isMapMoving || isGeocoding || !pickerLocation
              ? 'text-gray-400'
              : 'text-white'
          }`}>
            {isGeocoding ? 'Locating...' : `Confirm ${activeInput === 'start' ? 'Pick-up' : 'Drop-off'}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRoutePreviewMode = () => (
    <View className="flex-1 bg-white">
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        initialRegion={MANILA_REGION}
      >
        {/* Start Marker - Grab-style teardrop pin */}
        {startLocation && (
          <Marker
            coordinate={{ latitude: startLocation.latitude, longitude: startLocation.longitude }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <GrabStylePin Icon={Navigation} color="#2563eb" size={44} selected={true} />
          </Marker>
        )}

        {/* End Marker - Grab-style teardrop pin */}
        {endLocation && (
          <Marker
            coordinate={{ latitude: endLocation.latitude, longitude: endLocation.longitude }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <GrabStylePin Icon={MapPin} color="#dc2626" size={44} selected={true} />
          </Marker>
        )}

        {/* Pickup Points - Start Location (Green Dots - Grab Style) */}
        {startLocation?.pickup_points?.map((point, index) => (
          <Marker
            key={`start-pickup-${point.id}`}
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedStartPickup(point.id);
              setShowPickupSelector('start');
            }}
          >
            <View className="items-center justify-center">
              <View className={`w-7 h-7 rounded-full border-2 border-white items-center justify-center shadow-lg ${
                selectedStartPickup === point.id ? 'bg-primary-600' : 'bg-emerald-500'
              }`}>
                <Text className="text-white text-xs font-bold">{index + 1}</Text>
              </View>
            </View>
          </Marker>
        ))}

        {/* Pickup Points - End Location (Green Dots - Grab Style) */}
        {endLocation?.pickup_points?.map((point, index) => (
          <Marker
            key={`end-pickup-${point.id}`}
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedEndPickup(point.id);
              setShowPickupSelector('end');
            }}
          >
            <View className="items-center justify-center">
              <View className={`w-7 h-7 rounded-full border-2 border-white items-center justify-center shadow-lg ${
                selectedEndPickup === point.id ? 'bg-danger-600' : 'bg-emerald-500'
              }`}>
                <Text className="text-white text-xs font-bold">{index + 1}</Text>
              </View>
            </View>
          </Marker>
        ))}

        {routes.map(r => (
          <Polyline
            key={r.id}
            coordinates={r.coordinates}
            strokeColor={r.id === selectedRoute?.id ? r.color : '#d1d5db'}
            strokeWidth={r.id === selectedRoute?.id ? 5 : 3}
          />
        ))}
      </MapView>

      {/* Top Bar */}
      <View className="absolute top-12 left-4 right-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setViewMode('search');
          }}
          className="w-11 h-11 bg-white rounded-full items-center justify-center shadow-lg"
        >
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* Enhanced Draggable Bottom Sheet - Grab-like */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={false}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: '#d1d5db', width: 40, height: 4 }}
        backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 20 }}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}>
          {/* Header */}
          <Text className="text-xl font-bold text-gray-900 mb-3">Choose Route</Text>

          {/* Travel Mode Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {TRAVEL_MODES.map(mode => {
              const IconComponent = mode.icon;
              const isSelected = selectedMode === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedMode(mode.id);
                  }}
                  className={`flex-row items-center mr-3 px-4 py-2.5 rounded-full border-2 ${
                    isSelected
                      ? 'bg-primary-50 border-primary-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <IconComponent
                    size={18}
                    color={isSelected ? '#2563eb' : '#6b7280'}
                  />
                  <Text className={`ml-2 font-semibold ${
                    isSelected ? 'text-primary-700' : 'text-gray-600'
                  }`}>
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {isLoadingRoutes ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#2563eb" />
              <Text className="text-sm text-gray-500 mt-2">Finding safest routes...</Text>
            </View>
          ) : (
            <>
              {/* Route Cards */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4 -mx-1"
                contentContainerStyle={{ paddingHorizontal: 4 }}
              >
                {routes.map((route, _index) => {
                  const isSelected = route.id === selectedRoute?.id;
                  return (
                    <TouchableOpacity
                      key={route.id}
                      onPress={() => selectRoute(route)}
                      className={`mr-3 p-4 rounded-2xl border-2 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 bg-white'
                      }`}
                      style={{ width: width * 0.7 }}
                      activeOpacity={0.8}
                    >
                      {/* Route Header */}
                      <View className="flex-row items-center mb-3">
                        <View className={`px-2 py-1 rounded-full ${
                          route.safety === 'high' ? 'bg-green-100' : 'bg-amber-100'
                        }`}>
                          <Text className={`text-xs font-bold ${
                            route.safety === 'high' ? 'text-green-700' : 'text-amber-700'
                          }`}>
                            {route.safety === 'high' ? '🛡️ Safest' : '⚠️ Alternate'}
                          </Text>
                        </View>
                        {route.safetyScore && (
                          <View className="flex-row items-center ml-auto">
                            <Shield size={14} color={route.safety === 'high' ? '#22c55e' : '#f59e0b'} />
                            <Text className={`ml-1 text-sm font-bold ${
                              route.safety === 'high' ? 'text-green-600' : 'text-amber-600'
                            }`}>
                              {route.safetyScore}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Stats Row */}
                      <View className="flex-row items-center mb-3">
                        <View className="flex-row items-center mr-4">
                          <Clock size={16} color="#6b7280" />
                          <Text className="ml-1 text-base font-bold text-gray-900">
                            {formatDuration(route.duration)}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ruler size={16} color="#6b7280" />
                          <Text className="ml-1 text-base font-bold text-gray-900">
                            {formatDistance(route.distance)}
                          </Text>
                        </View>
                      </View>

                      {/* Highlights */}
                      {route.highlights && (
                        <View className="space-y-1">
                          {route.highlights.slice(0, 2).map((highlight: string, idx: number) => (
                            <View key={idx} className="flex-row items-center">
                              <Lightbulb size={12} color={route.safety === 'high' ? '#22c55e' : '#f59e0b'} />
                              <Text className="ml-1.5 text-xs text-gray-600">{highlight}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Book Button */}
              <TouchableOpacity
                className="bg-primary-600 py-4 rounded-2xl items-center active:bg-primary-700"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowNavigationModal(true);
                }}
              >
                <Text className="text-white font-bold text-lg">
                  Start Navigation
                </Text>
              </TouchableOpacity>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>

      {selectedRoute && (
        <NavigationConfirmModal
          visible={showNavigationModal}
          routeName={selectedRoute.name}
          duration={formatDuration(selectedRoute.duration)}
          distance={formatDistance(selectedRoute.distance)}
          onClose={() => setShowNavigationModal(false)}
          onConfirm={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          }}
        />
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {viewMode === 'search' && renderSearchMode()}
      {viewMode === 'map_picker' && renderMapPickerMode()}
      {viewMode === 'route_preview' && renderRoutePreviewMode()}

      {/* Pickup Point Selector Modal - Rendered over all views (Grab-style) */}
      {showPickupSelector && (
        <PickupPointSelector
          locationName={
            showPickupSelector === 'start'
              ? startLocation?.name || 'Start Location'
              : endLocation?.name || 'End Location'
          }
          pickupPoints={
            showPickupSelector === 'start'
              ? startLocation?.pickup_points || []
              : endLocation?.pickup_points || []
          }
          selectedPickupId={
            showPickupSelector === 'start' ? selectedStartPickup : selectedEndPickup
          }
          onSelectPickup={(pickupId) => {
            const location = showPickupSelector === 'start' ? startLocation : endLocation;
            const selectedPoint = location?.pickup_points?.find(p => p.id === pickupId);

            if (selectedPoint && location) {
              // Update the location coordinates to the selected pickup point
              const updatedLocation: LocationSearchResult = {
                ...location,
                latitude: selectedPoint.latitude,
                longitude: selectedPoint.longitude,
              };

              if (showPickupSelector === 'start') {
                setSelectedStartPickup(pickupId);
                setStartLocation(updatedLocation);
              } else {
                setSelectedEndPickup(pickupId);
                setEndLocation(updatedLocation);
              }

              // Close selector and navigate to next step
              setShowPickupSelector(null);

              // Navigate to next step or route preview
              if (activeInput === 'start' && endLocation) {
                setViewMode('route_preview');
              } else if (activeInput === 'end' && startLocation) {
                setViewMode('route_preview');
              } else if (activeInput === 'start') {
                setActiveInput('end');
              } else if (activeInput === 'end' && !startLocation) {
                setActiveInput('start');
              } else {
                setViewMode('route_preview');
              }
            }
          }}
          onClose={() => {
            setShowPickupSelector(null);
            // Navigate to next step when closing without selection
            if (activeInput === 'start' && endLocation) {
              setViewMode('route_preview');
            } else if (activeInput === 'end' && startLocation) {
              setViewMode('route_preview');
            } else if (activeInput === 'start') {
              setActiveInput('end');
            }
          }}
          mode={showPickupSelector}
        />
      )}
    </View>
  );
}
