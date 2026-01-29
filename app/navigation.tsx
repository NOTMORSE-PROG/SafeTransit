import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, StatusBar, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import Animated, { SlideInUp } from 'react-native-reanimated';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  X, 
  MapPin,
  Navigation
} from 'lucide-react-native';
import { Route } from '../services/locationIQRouting';
import { Tip } from '../services/tipsService';
import { TipMarkerIcon } from '../components/map/TipMarkerIcon';
import TipDetailCard from '../components/map/TipDetailCard';
import { OptimizedMarker } from '../components/map/OptimizedMarker';

// Helper to calculate distance between two points (Haversine formula)
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d * 1000; // Distance in m
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// Helper to validate coordinate
const isValidCoord = (c: any): boolean => 
  !!c && typeof c.latitude === 'number' && !isNaN(c.latitude) &&
  typeof c.longitude === 'number' && !isNaN(c.longitude);

export default function NavigationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const lastCameraUpdateMsRef = useRef(0);
  
  // State
  const [route, setRoute] = useState<Route | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [distanceToNextStep, setDistanceToNextStep] = useState(0);
  const [isTracking, setIsTracking] = useState(true);
  const [heading, setHeading] = useState(0);
  const [isMapReady, setIsMapReady] = useState(false);

  // Parse route params
  useEffect(() => {
    if (params.routeData) {
      try {
        const parsedRoute = JSON.parse(params.routeData as string);
        setRoute(parsedRoute);
      } catch (e) {
        console.error('Error parsing route data:', e);
        Alert.alert('Error', 'Invalid route data');
        router.back();
      }
    }
    
    if (params.tipsData) {
      try {
        const parsedTips = JSON.parse(params.tipsData as string);
        setTips(parsedTips);
      } catch (e) {
        console.error('Error parsing tips data:', e);
      }
    }
  }, [params.routeData, params.tipsData, router]);

  // Track user location
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let isActive = true;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for navigation');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 500,
          distanceInterval: 5, // Update every 5 meters
        },
        (location) => {
          if (!isActive) return;
          setCurrentLocation(location);
          setHeading(location.coords.heading || 0);
          
          // Update map camera
          // Important: avoid fighting Google Maps internal state while user taps markers / modal is open.
          // This prevents a known Android Google Maps IllegalStateException in some devices.
          if (isMapReady && isTracking && !selectedTip && mapRef.current) {
            const now = Date.now();
            // Throttle camera updates to reduce native contention.
            if (now - lastCameraUpdateMsRef.current >= 500) {
              lastCameraUpdateMsRef.current = now;
              mapRef.current.animateCamera(
                {
                  center: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  },
                  heading: location.coords.heading || 0,
                  pitch: 45,
                  zoom: 18,
                },
                { duration: 500 }
              );
            }
          }
        }
      );
    };

    startTracking();

    return () => {
      isActive = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isTracking, isMapReady, selectedTip]);

  // Navigation Logic
  useEffect(() => {
    if (!currentLocation || !route || !route.steps || route.steps.length === 0) return;

    // Determine target location (next maneuver or destination)
    let targetLat: number;
    let targetLon: number;
    
    // If we are at the last step, target is the end of the route
    if (currentStepIndex >= route.steps.length - 1) {
      const lastCoord = route.coordinates[route.coordinates.length - 1];
      targetLat = lastCoord.latitude;
      targetLon = lastCoord.longitude;
    } else {
      // Target is the start of the NEXT step (which is the maneuver point)
      const nextStep = route.steps[currentStepIndex + 1];
      if (nextStep.maneuver.location) {
        targetLat = nextStep.maneuver.location.latitude;
        targetLon = nextStep.maneuver.location.longitude;
      } else {
        // Fallback if location missing (shouldn't happen with our updates)
        return;
      }
    }

    const dist = getDistanceFromLatLonInMeters(
      currentLocation.coords.latitude,
      currentLocation.coords.longitude,
      targetLat,
      targetLon
    );
    
    setDistanceToNextStep(dist);

    // If within 20 meters of the target, advance to next step
    if (dist < 20) {
      if (currentStepIndex < route.steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
        // Optional: Haptic feedback or sound
      } else {
        // Arrived!
        Alert.alert("Arrived!", "You have reached your destination.");
        setIsTracking(false);
      }
    }
  }, [currentLocation, route, currentStepIndex]);

  if (!route) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-neutral-600">Loading navigation...</Text>
      </View>
    );
  }

  const currentStep = route.steps[currentStepIndex];
  const nextStep = route.steps[currentStepIndex + 1];
  const isLastStep = currentStepIndex === route.steps.length - 1;

  // Get icon for maneuver
  const getManeuverIcon = (type: string, modifier?: string) => {
    if (type === 'arrive') return <MapPin color="#ffffff" size={32} />;
    if (modifier?.includes('left')) return <ArrowLeft color="#ffffff" size={32} />;
    if (modifier?.includes('right')) return <ArrowRight color="#ffffff" size={32} />;
    return <ArrowUp color="#ffffff" size={32} />;
  };

  // Memoize valid coordinates to avoid recalculating on every render
  const validRouteCoordinates = route?.coordinates?.filter(isValidCoord) || [];

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        onMapReady={() => setIsMapReady(true)}
        maxZoomLevel={18}
        initialRegion={{
          latitude: route.coordinates[0].latitude,
          longitude: route.coordinates[0].longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        }}
        onPanDrag={() => setIsTracking(false)}
      >
        {validRouteCoordinates.length >= 2 && (
          <Polyline
            coordinates={validRouteCoordinates}
            strokeColor="#2563eb"
            strokeWidth={5}
          />
        )}

        {/* Destination Marker */}
        {validRouteCoordinates.length > 0 && (
          <Marker
            coordinate={validRouteCoordinates[validRouteCoordinates.length - 1]}
            title="Destination"
          >
             <MapPin color="#ef4444" size={32} fill="#fee2e2" />
          </Marker>
        )}

        {/* User Marker with Heading */}
        {currentLocation && isValidCoord(currentLocation.coords) && (
          <Marker
            coordinate={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }}
            rotation={heading}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
          >
            <View className="w-6 h-6 bg-primary-600 rounded-full border-2 border-white" />
          </Marker>
        )}

        {/* Tip Markers */}
        {tips
          .filter(isValidCoord)
          .map((tip, idx) => (
          <OptimizedMarker
            key={`tip-${tip.id}-${idx}`}
            coordinate={{
              latitude: tip.latitude,
              longitude: tip.longitude,
            }}
            onPress={() => {
              // Pause tracking while the tip modal is open
              setIsTracking(false);
              setSelectedTip(tip);
            }}
          >
            <TipMarkerIcon category={tip.category} size={28} />
          </OptimizedMarker>
        ))}
      </MapView>

      {/* Top Instruction Panel */}
      <View 
        className="absolute left-4 right-4 bg-primary-600 rounded-2xl shadow-lg p-4"
        style={{ top: insets.top + 10 }}
      >
        <View className="flex-row">
          <View className="mr-4 mt-1">
            {getManeuverIcon(currentStep?.maneuver.type, currentStep?.maneuver.modifier)}
          </View>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold leading-6">
              {isLastStep ? "Arriving at destination" : (currentStep?.instruction || "Follow route")}
            </Text>
            <Text className="text-primary-200 text-sm font-bold mt-1">
              {distanceToNextStep < 1000 
                ? `${Math.round(distanceToNextStep)} m` 
                : `${(distanceToNextStep / 1000).toFixed(1)} km`}
            </Text>
            {nextStep && !isLastStep && (
              <Text className="text-primary-100 text-sm mt-2">
                Then: {nextStep.instruction}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Re-center Button */}
      {!isTracking && (
        <Animated.View 
          entering={SlideInUp.duration(300)}
          className="absolute right-4"
          style={{ bottom: Math.max(insets.bottom, 20) + 180 }} // Position above the bottom panel
        >
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsTracking(true);
              
              // Immediate camera update
              if (currentLocation && mapRef.current) {
                mapRef.current.animateCamera({
                  center: {
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                  },
                  heading: currentLocation.coords.heading || 0,
                  pitch: 45,
                  zoom: 18,
                }, { duration: 400 });
              }
            }}
            className="bg-white px-4 py-3 rounded-full shadow-lg border border-neutral-200 flex-row items-center"
            activeOpacity={0.8}
          >
            <Navigation color="#2563eb" size={20} fill="#2563eb" />
            <Text className="ml-2 font-bold text-primary-600">Re-center</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Bottom Info Panel */}
      <View 
        className="absolute left-0 right-0 bg-white shadow-2xl rounded-t-3xl px-6 pt-6"
        style={{ bottom: 0, paddingBottom: Math.max(insets.bottom, 20) + 20 }}
      >
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-neutral-500 text-sm font-medium">Time Remaining</Text>
            <Text className="text-2xl font-bold text-neutral-900">
              {Math.ceil((route.duration || 0) / 60)} min
            </Text>
          </View>
          <View>
            <Text className="text-neutral-500 text-sm font-medium">Distance</Text>
            <Text className="text-2xl font-bold text-neutral-900">
              {((route.distance || 0) / 1000).toFixed(1)} km
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-danger-100 p-3 rounded-full"
          >
            <X color="#dc2626" size={24} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-danger-600 w-full py-4 rounded-xl"
        >
          <Text className="text-white text-center font-bold text-lg">
            End Navigation
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selected Tip Detail Card Modal */}
      {selectedTip && (
        <>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              setSelectedTip(null);
            }}
            className="absolute left-0 right-0 top-0 bottom-0"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 100 }}
          />
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
                tip={selectedTip}
                onClose={() => {
                  setSelectedTip(null);
                }}
              />
            </Animated.View>
          </View>
        </>
      )}
    </View>
  );
}
