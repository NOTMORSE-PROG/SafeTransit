import { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Dimensions, ScrollView, Pressable, GestureResponderEvent } from "react-native";
import { useRouter } from "expo-router";
import ClusteredMapView from "react-native-map-clustering";
import MapView, { Region, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  AlertOctagon,
  ShieldCheck,
  Cloud,
  Search,
  Lightbulb,
  AlertTriangle,
  Navigation2,
} from "lucide-react-native";
import EmergencyAlertModal from "../../components/EmergencyAlertModal";
import ProtectionEnabledModal from "../../components/ProtectionEnabledModal";
import FamilyLocationRow from "../../components/FamilyLocationRow";
import FamilyMemberModal from "../../components/FamilyMemberModal";
import TipMarker from "../../components/map/TipMarker";
import TipDetailCard from "../../components/map/TipDetailCard";
import FamilyMemberMarker from "../../components/map/FamilyMemberMarker";
import FilterChips, { FilterState } from "../../components/map/FilterChips";
import SafetyHeatmap from "../../components/map/SafetyHeatmap";
import SafetyStats from "../../components/map/SafetyStats";
import { MarkerSkeletonGrid } from "../../components/map/MarkerSkeleton";
import {
  Tip,
  fetchTips,
  cleanupExpiredCache,
} from "../../services/tipsService";
import { HeatmapZone } from "../../services/heatmapCacheService";
import {
  FamilyMember,
  familyLocationService,
} from "../../services/familyLocationService";
import { colors } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { useModal } from "../../contexts/ModalContext";

const { width, height } = Dimensions.get("window");
const SHEET_MIN_HEIGHT = 280;
const SHEET_MAX_HEIGHT = 380;
const SHEET_PEEK_HEIGHT = 40; // Height when collapsed (just showing handle)

const INITIAL_REGION = {
  latitude: 14.5995, // Manila/Makati center
  longitude: 120.9842,
  latitudeDelta: 0.15, // Wider view to show more of Metro Manila
  longitudeDelta: 0.15,
};

// Removed old TipData interface - now using Tip from tipsService

export default function Home() {
  const router = useRouter();
  const { user: _user, token: _token, isLoading: _authLoading } = useAuth();
  const mapRef = useRef<MapView>(null);
  const [isProtectionOn, setIsProtectionOn] = useState(true);
  const [_currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const [_isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [isEmergencyModalVisible, setIsEmergencyModalVisible] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [isProtectionModalVisible, setIsProtectionModalVisible] =
    useState(false);

  // Tips & Clustering State
  const [tips, setTips] = useState<Tip[]>([]);
  const [isLoadingTips, setIsLoadingTips] = useState(false);
  const [tipsError, setTipsError] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(INITIAL_REGION);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    radius: 5000,
    timeRelevance: null,
  });

  // Heatmap State
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapZones, setHeatmapZones] = useState<HeatmapZone[]>([]);

  // Family Location State
  const [selectedFamilyMember, setSelectedFamilyMember] =
    useState<FamilyMember | null>(null);
  const [isFamilyModalVisible, setIsFamilyModalVisible] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // UI State
  const [showStats, _setShowStats] = useState(true);

  // Modal context for communicating with parent layout
  const { setIsModalOpen } = useModal();

  // Sync modal state with context
  useEffect(() => {
    setIsModalOpen(!!selectedTip);
  }, [selectedTip, setIsModalOpen]);

  const translateY = useSharedValue(SHEET_MAX_HEIGHT - SHEET_MIN_HEIGHT);
  const startY = useSharedValue(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const getCurrentLocation = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);

      // Always zoom to user's location with medium zoom level
      const userRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05, // Medium zoom (~5km radius)
        longitudeDelta: 0.05,
      };

      setMapRegion(userRegion);

      // Animate map to user location
      if (mapRef.current) {
        mapRef.current.animateToRegion(userRegion, 500);
      }

      console.log(
        `[Home] Centered on user location: ${location.coords.latitude}, ${location.coords.longitude}`,
      );
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  // Use refs to track latest values without causing re-renders
  const filtersRef = useRef(filters);
  const mapRegionRef = useRef(mapRegion);

  useEffect(() => {
    filtersRef.current = filters;
    mapRegionRef.current = mapRegion;
  }, [filters, mapRegion]);

  const loadTips = useCallback(async () => {
    let isMounted = true;
    const controller = new AbortController();

    try {
      setIsLoadingTips(true);
      setTipsError(null);

      // Use refs to get latest values
      const currentFilters = filtersRef.current;
      const currentRegion = mapRegionRef.current;

      const fetchedTips = await fetchTips({
        lat: currentRegion.latitude,
        lon: currentRegion.longitude,
        radius: currentFilters.radius,
        category:
          currentFilters.categories.length === 1
            ? currentFilters.categories[0]
            : undefined,
        time: currentFilters.timeRelevance || undefined,
      });

      // Only update state if component is still mounted
      if (!isMounted || controller.signal.aborted) return;

      setTips(fetchedTips);
      console.log(
        `[Home] Successfully loaded ${fetchedTips.length} tips from API`,
      );
    } catch (error: unknown) {
      // Ignore aborted requests
      if (controller.signal.aborted) return;

      if (!isMounted) return;

      console.error("Error loading tips:", error);
      // Display user-friendly error message
      const err = error as { code?: string };
      if (err.code === "NETWORK_ERROR") {
        setTipsError(
          "Unable to connect. Please check your internet connection.",
        );
      } else if (err.code === "AUTH_ERROR") {
        setTipsError("Authentication failed. Please sign in again.");
      } else {
        setTipsError("Failed to load safety tips. Please try again.");
      }
    } finally {
      if (isMounted) {
        setIsLoadingTips(false);
      }
    }

    // Return cleanup function
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []); // Empty deps - stable reference

  const loadFamilyMembers = useCallback(async () => {
    try {
      const members = await familyLocationService.getFamilyLocations();
      setFamilyMembers(members);
    } catch (error) {
      console.error("Error loading family members:", error);
      // Don't show error to user - family locations are optional
    }
  }, []);

  // Initial load on mount - get location first, then load tips and family
  useEffect(() => {
    const init = async () => {
      await getCurrentLocation();
      await loadTips();
      await loadFamilyMembers();
    };
    init();
  }, [loadTips, loadFamilyMembers]);

  // Refresh family members every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadFamilyMembers();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadFamilyMembers]);

  // Request ID tracking to prevent race conditions
  const requestIdRef = useRef(0);

  // Consolidated debounced reload function
  const triggerTipReload = useCallback(() => {
    requestIdRef.current++;
    const currentRequestId = requestIdRef.current;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      // Only execute if still the latest request
      if (currentRequestId === requestIdRef.current) {
        await loadTips();
      }
    }, 500);
  }, [loadTips]);

  // Reload tips when filters change
  useEffect(() => {
    triggerTipReload();
  }, [filters, triggerTipReload]);

  // Debounced map region change
  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      // Only update if region changed significantly (prevent jitter)
      const latChanged =
        Math.abs(region.latitude - mapRegion.latitude) > 0.0001;
      const lonChanged =
        Math.abs(region.longitude - mapRegion.longitude) > 0.0001;
      const deltaChanged =
        Math.abs(region.latitudeDelta - mapRegion.latitudeDelta) > 0.0001;

      if (latChanged || lonChanged || deltaChanged) {
        setMapRegion(region);
        triggerTipReload();
      }
    },
    [mapRegion, triggerTipReload],
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Periodic cache cleanup to prevent memory leaks
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cleanupExpiredCache(); // AsyncStorage cache cleanup
    }, 60000); // Every 60 seconds

    return () => clearInterval(cleanupInterval);
  }, []);

  const handleTipPress = (tip: Tip) => {
    setSelectedTip(tip);
  };

  const handleToggleProtection = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProtectionOn(!isProtectionOn);

    if (!isProtectionOn) {
      setIsProtectionModalVisible(true);
    }
  };

  const handlePanicPress = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsEmergencyModalVisible(true);
  };

  const handleQuickExit = () => {
    router.push("/quick-exit");
  };

  return (
    <View className="flex-1">
      {/* Map */}
      <ClusteredMapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ width, height }}
        initialRegion={INITIAL_REGION}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
        radius={80}
        maxZoom={18}
        minZoom={0}
        minPoints={2}
        extent={512}
        nodeSize={64}
        clusterColor={colors.primary[500]}
        clusterTextColor="#fff"
        spiderLineColor={colors.primary[500]}
        animationEnabled={false}
        preserveClusterPressBehavior={false}
      >
        {/* Safety Zones - Temporarily disabled to isolate crash */}
        {/* {MOCK_ZONES.map((zone) => (
          <Polygon
            key={zone.id}
            coordinates={zone.coordinates}
            fillColor={getZoneColor(zone.risk_level)}
            strokeColor={getZoneStrokeColor(zone.risk_level)}
            strokeWidth={getZoneStrokeWidth(zone.risk_level)}
          />
        ))} */}

        {/* Safety Heatmap Overlay - Now enabled with proper API integration and caching */}
        <SafetyHeatmap
          region={mapRegion}
          visible={showHeatmap}
          onZonesChange={setHeatmapZones}
        />

        {/* Loading Skeletons - Show during initial load */}
        {isLoadingTips && tips.length === 0 && (
          <MarkerSkeletonGrid region={mapRegion} count={12} />
        )}

        {/* Tips with Native Clustering */}
        {tips.map((tip) => (
          <TipMarker key={`tip-${tip.id}`} tip={tip} onPress={handleTipPress} />
        ))}

        {/* Family Member Markers */}
        {familyMembers.map((member) => (
          <FamilyMemberMarker
            key={`family-${member.user_id}`}
            member={member}
            onPress={(member) => {
              setSelectedFamilyMember(member);
              setIsFamilyModalVisible(true);
            }}
          />
        ))}
      </ClusteredMapView>

      {/* Error Message */}
      {tipsError && !isLoadingTips && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          className="absolute top-32 left-6 right-6"
        >
          <View className="bg-danger-50 border-2 border-danger-500 rounded-xl px-4 py-3 shadow-lg">
            <View className="flex-row items-start">
              <AlertTriangle
                size={20}
                color={colors.danger[500]}
                strokeWidth={2}
              />
              <View className="flex-1 ml-3">
                <Text className="text-danger-700 font-semibold text-sm mb-1">
                  Error Loading Tips
                </Text>
                <Text className="text-danger-600 text-xs">{tipsError}</Text>
              </View>
              <TouchableOpacity
                onPress={loadTips}
                className="ml-2 bg-danger-600 px-3 py-1.5 rounded-lg"
                activeOpacity={0.8}
              >
                <Text className="text-white text-xs font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Safety Stats Widget */}
      {showStats && tips.length > 0 && !tipsError && (
        <Animated.View entering={FadeIn.duration(300).delay(200)}>
          <SafetyStats tips={tips} heatmapZones={heatmapZones} />
        </Animated.View>
      )}

      {/* Simple Top Bar */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        className="absolute top-12 left-6 right-6 flex-row items-center justify-between"
      >
        {/* Status Badge */}
        <View
          className={`px-4 py-2 rounded-full shadow-lg ${isProtectionOn ? "bg-primary-600" : "bg-neutral-500"}`}
        >
          <View className="flex-row items-center">
            <ShieldCheck color="#ffffff" size={16} strokeWidth={2.5} />
            <Text className="text-white text-sm font-semibold ml-2">
              {isProtectionOn ? "Protected" : "Unprotected"}
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
          <Cloud color={colors.primary[400]} size={24} strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>

      {/* Legend - Tip Severity */}
      <View
        className="absolute top-24 right-6 bg-white/95 rounded-xl p-3 shadow-md"
        style={{ marginTop: 40 }}
      >
        <Text className="text-xs font-semibold text-neutral-800 mb-2">
          Tip Severity
        </Text>
        <View className="flex-row items-center mb-1.5">
          <View
            className="w-4 h-3 rounded bg-safe-500 mr-2"
            style={{ borderWidth: 1, borderColor: colors.safe[500] }}
          />
          <Text className="text-xs text-neutral-700">Low</Text>
        </View>
        <View className="flex-row items-center mb-1.5">
          <View
            className="w-4 h-3 rounded bg-caution-500/20 mr-2"
            style={{
              borderWidth: 1,
              borderColor: colors.caution[500],
              borderStyle: "dashed",
            }}
          />
          <Text className="text-xs text-neutral-700">Medium</Text>
        </View>
        <View className="flex-row items-center">
          <View
            className="w-4 h-3 rounded bg-danger-500 mr-2"
            style={{ borderWidth: 1.5, borderColor: colors.danger[500] }}
          />
          <Text className="text-xs text-neutral-700">High</Text>
        </View>
      </View>

      {/* Heatmap Toggle */}
      <TouchableOpacity
        onPress={() => {
          setShowHeatmap(!showHeatmap);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        className="absolute top-24 right-6 bg-white/95 rounded-xl px-3 py-2 shadow-md"
        style={{ marginTop: 160 }}
        activeOpacity={0.7}
      >
        <Text
          className="text-xs font-semibold"
          style={{
            color: showHeatmap ? colors.primary[600] : colors.neutral[700],
          }}
        >
          {showHeatmap ? "✓ " : ""}Heatmap
        </Text>
      </TouchableOpacity>

      {/* Filter Chips */}
      <FilterChips filters={filters} onFiltersChange={setFilters} />

      {/* RECENTER BUTTON - Google Maps style */}
      <Animated.View
        entering={FadeIn.delay(600)}
        className="absolute"
        style={{ bottom: 180, left: 24 }}
      >
        <TouchableOpacity
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await getCurrentLocation();
          }}
          className="w-14 h-14 rounded-full bg-white items-center justify-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 6,
          }}
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel="Recenter map to current location"
          accessibilityRole="button"
        >
          <Navigation2 color={colors.primary[600]} size={24} strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View
        entering={SlideInUp.duration(600)}
        className="absolute left-0 right-0 bg-white rounded-t-3xl shadow-2xl"
        style={[
          {
            bottom: 0,
            height: SHEET_MAX_HEIGHT,
          },
          sheetStyle,
        ]}
      >
        {/* Handle Bar - Draggable (Fixed) */}
        <View className="px-6 pt-6">
          <GestureDetector gesture={panGesture}>
            <Animated.View className="items-center py-3 mb-2">
              <View className="w-16 h-1.5 bg-neutral-400 rounded-full" />
              <Text
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  marginTop: 6,
                  opacity: 0.7,
                }}
              >
                Drag to expand or collapse
              </Text>
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 80 }}
        >
          {/* Protection Toggle */}
          <TouchableOpacity
            onPress={handleToggleProtection}
            className={`rounded-2xl p-4 mb-4 ${isProtectionOn ? "bg-primary-50 border-2 border-primary-600" : "bg-neutral-100 border-2 border-neutral-300"}`}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Background protection toggle"
            accessibilityRole="button"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${isProtectionOn ? "bg-primary-600" : "bg-neutral-400"}`}
                >
                  <ShieldCheck color="#ffffff" size={24} strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-neutral-900 mb-1">
                    Background Protection
                  </Text>
                  <Text
                    className={`text-xs ${isProtectionOn ? "text-primary-700" : "text-neutral-500"}`}
                  >
                    {isProtectionOn
                      ? "Monitoring your location"
                      : "Tap to enable protection"}
                  </Text>
                </View>
              </View>
              <View
                className={`w-12 h-7 rounded-full justify-center ${isProtectionOn ? "bg-primary-600" : "bg-neutral-300"}`}
              >
                <View
                  className={`w-5 h-5 rounded-full bg-white shadow ${isProtectionOn ? "ml-6" : "ml-1"}`}
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* Family Location Row */}
          <FamilyLocationRow
            onMemberPress={(member) => {
              setSelectedFamilyMember(member);
              setIsFamilyModalVisible(true);
            }}
            onCenterOnMember={(member) => {
              if (mapRef.current) {
                mapRef.current.animateToRegion(
                  {
                    latitude: member.latitude,
                    longitude: member.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  },
                  1000,
                );
              }
            }}
            className="-mx-6 px-6 border-t border-gray-100 mb-4"
          />

          {/* Route Planning */}
          <TouchableOpacity
            onPress={() => router.push("/route-planning")}
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
            onPress={() => router.push("/add-tip")}
            className="bg-primary-600 rounded-2xl py-4"
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Add community safety tip"
            accessibilityRole="button"
          >
            <View className="items-center">
              <Lightbulb color="#ffffff" size={28} strokeWidth={2} />
              <Text className="text-white font-bold text-sm mt-1">
                Add Safety Tip
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* Selected Tip Detail Card */}
      {selectedTip && (
        <Pressable
          onPress={() => setSelectedTip(null)}
          className="absolute left-0 right-0 top-0 bottom-0 justify-center items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <Pressable
            onPress={(e: GestureResponderEvent) => {
              e.stopPropagation();
            }}
          >
            <Animated.View
              entering={SlideInUp.duration(400)}
              className="w-11/12 max-w-lg"
              style={{ width: width * 0.92 }}
            >
              <TipDetailCard
                tip={selectedTip}
                onClose={() => setSelectedTip(null)}
              />
            </Animated.View>
          </Pressable>
        </Pressable>
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
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning,
            );
            handlePanicPress();
          }}
          onPress={() => setIsConfirmModalVisible(true)}
          className="w-18 h-18 rounded-full bg-danger-600 items-center justify-center"
          style={{
            shadowColor: "#dc2626",
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

      {/* Confirmation Modal - Before sending alert */}
      <EmergencyAlertModal
        visible={isConfirmModalVisible}
        title="Emergency Alert"
        message="Send silent alert to emergency contacts and nearby helpers?"
        onClose={() => setIsConfirmModalVisible(false)}
        isConfirmation={true}
        onConfirm={handlePanicPress}
        confirmText="Send Alert"
        cancelText="Cancel"
      />

      {/* Success Modal - After alert sent */}
      <EmergencyAlertModal
        visible={isEmergencyModalVisible}
        title="Emergency Alert"
        message="Silent alert sent to nearby helpers and emergency contacts."
        onClose={() => setIsEmergencyModalVisible(false)}
        buttonText="OK"
      />

      {/* Protection Enabled Modal */}
      <ProtectionEnabledModal
        visible={isProtectionModalVisible}
        onClose={() => setIsProtectionModalVisible(false)}
      />

      {/* Family Member Modal */}
      <FamilyMemberModal
        member={selectedFamilyMember}
        isVisible={isFamilyModalVisible}
        onClose={() => {
          setIsFamilyModalVisible(false);
          setSelectedFamilyMember(null);
        }}
        onCenterOnMap={(member) => {
          if (mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude: member.latitude,
                longitude: member.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              1000,
            );
          }
          setIsFamilyModalVisible(false);
          setSelectedFamilyMember(null);
        }}
      />
    </View>
  );
}
