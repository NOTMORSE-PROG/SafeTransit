import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Keyboard,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, Region } from "react-native-maps";
import { MapPin, Check, Locate, Search, X } from "lucide-react-native";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

interface LocationPickerProps {
  initialLocation?: { latitude: number; longitude: number };
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    locationName: string;
  }) => void;
  onCancel: () => void;
}

interface SearchResult {
  name: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  type?: string; // e.g., "street", "building", "poi"
}

interface LocationIQResult {
  display_name: string;
  display_place?: string;
  display_address?: string;
  lat: string;
  lon: string;
  type?: string;
  address?: {
    name?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
  };
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation = { latitude: 14.5995, longitude: 120.9842 }, // Default Manila
  onLocationSelect,
  onCancel,
}) => {
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [locationName, setLocationName] = useState("Getting location name...");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get place name from coordinates using reverse geocoding
  const getPlaceName = async (latitude: number, longitude: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (results && results.length > 0) {
        const place = results[0];
        const parts = [
          place.street,
          place.district,
          place.city || place.subregion,
        ].filter(Boolean);
        return parts.length > 0
          ? parts.join(", ")
          : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  };

  // Search for places using LocationIQ API (OpenStreetMap data, same as Grab!)
  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search requests
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);

        // LocationIQ Autocomplete API - 10,000 free requests/day
        const apiKey = process.env.EXPO_PUBLIC_LOCATIONIQ_API_KEY;

        if (!apiKey) {
          console.error(
            "LocationIQ API key not found in environment variables",
          );
          setSearchResults([]);
          return;
        }

        // Call LocationIQ Autocomplete API with Philippines focus
        const response = await fetch(
          `https://api.locationiq.com/v1/autocomplete?key=${apiKey}&q=${encodeURIComponent(query)}&countrycodes=ph&limit=10&dedupe=1&tag=place:*,highway:*,amenity:*,building:*`,
        );

        if (!response.ok) {
          throw new Error(`LocationIQ API error: ${response.status}`);
        }

        const data: LocationIQResult[] = await response.json();

        if (data && data.length > 0) {
          const mappedResults: SearchResult[] = data.map(
            (result: LocationIQResult) => {
              // Extract name from display_place or address
              const name =
                result.display_place ||
                result.address?.name ||
                result.address?.road ||
                result.display_name.split(",")[0];

              // Build formatted address
              const addressParts = [
                result.address?.road,
                result.address?.suburb,
                result.address?.city,
              ].filter(Boolean);

              const formattedAddress =
                addressParts.length > 0
                  ? addressParts.join(", ")
                  : result.display_name;

              return {
                name: name || "Unnamed location",
                formatted_address: formattedAddress,
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon),
                type: result.type,
              };
            },
          );

          setSearchResults(mappedResults);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Error searching places with LocationIQ:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce
  }, []);

  // Update location name when component mounts
  useEffect(() => {
    getPlaceName(selectedLocation.latitude, selectedLocation.longitude).then(
      setLocationName,
    );
  }, [selectedLocation.latitude, selectedLocation.longitude]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleMapPress = async (event: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } };
  }) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setLocationName("Getting location name...");
    const name = await getPlaceName(latitude, longitude);
    setLocationName(name);
  };

  const handleSearchResultPress = async (result: SearchResult) => {
    setSelectedLocation({
      latitude: result.latitude,
      longitude: result.longitude,
    });
    setSearchQuery("");
    setShowSearchResults(false);
    setLocationName("Getting location name...");
    Keyboard.dismiss();

    // Animate to selected location
    mapRef.current?.animateToRegion(
      {
        latitude: result.latitude,
        longitude: result.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      500,
    );

    const name = await getPlaceName(result.latitude, result.longitude);
    setLocationName(name);
  };

  const handleMyLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission is required to use this feature");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setSelectedLocation({ latitude, longitude });
      setLocationName("Getting location name...");

      // Animate map to user location with close zoom
      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.005, // Close zoom
          longitudeDelta: 0.005,
        },
        500,
      );

      const name = await getPlaceName(latitude, longitude);
      setLocationName(name);
    } catch (error) {
      console.error("Error getting current location:", error);
      alert("Unable to get your location");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleConfirm = () => {
    onLocationSelect({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      locationName,
    });
  };

  const INITIAL_REGION: Region = {
    latitude: initialLocation.latitude,
    longitude: initialLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Selected Location Marker */}
        <Marker
          coordinate={selectedLocation}
          draggable
          onDragEnd={async (e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setSelectedLocation({ latitude, longitude });
            setLocationName("Getting location name...");
            const name = await getPlaceName(latitude, longitude);
            setLocationName(name);
          }}
        >
          <View style={styles.markerContainer}>
            <MapPin size={32} color={colors.danger[500]} strokeWidth={2.5} />
          </View>
        </Marker>
      </MapView>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { top: insets.top + 10 }]}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a place..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowSearchResults(text.length > 0);
              searchPlaces(text);
            }}
            onFocus={() => setShowSearchResults(searchQuery.length > 0)}
            placeholderTextColor={colors.neutral[400]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setShowSearchResults(false);
                setSearchResults([]);
              }}
            >
              <X size={20} color={colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {showSearchResults && (
          <View style={styles.searchResults}>
            {isSearching ? (
              <View style={styles.searchLoading}>
                <ActivityIndicator size="small" color={colors.primary[600]} />
                <Text style={styles.searchLoadingText}>
                  Searching places...
                </Text>
              </View>
            ) : searchResults.length > 0 ? (
              <ScrollView keyboardShouldPersistTaps="handled">
                {searchResults.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.searchResultItem}
                    onPress={() => handleSearchResultPress(result)}
                  >
                    <MapPin size={16} color={colors.primary[600]} />
                    <View style={styles.searchResultText}>
                      <Text style={styles.searchResultName}>{result.name}</Text>
                      <Text style={styles.searchResultAddress}>
                        {result.formatted_address}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.searchLoading}>
                <Text style={styles.noResultsText}>No places found</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* My Location Button */}
      <TouchableOpacity
        style={[styles.myLocationButton, { top: insets.top + 80 }]}
        onPress={handleMyLocation}
        disabled={isLoadingLocation}
        activeOpacity={0.7}
      >
        <Locate size={24} color={colors.primary[600]} strokeWidth={2} />
      </TouchableOpacity>

      {/* Bottom Controls */}
      <View
        style={[
          styles.controls,
          { paddingBottom: Math.max(insets.bottom, 16) + 8 },
        ]}
      >
        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>Selected Location</Text>
          <Text style={styles.locationCoords} numberOfLines={2}>
            {locationName}
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.7}
          >
            <Check size={20} color="white" />
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  map: {
    width,
    height,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.neutral[900],
  },
  searchResults: {
    marginTop: 8,
    backgroundColor: "white",
    borderRadius: 12,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    gap: 10,
  },
  searchResultText: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral[900],
    marginBottom: 2,
  },
  searchResultAddress: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  searchLoading: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  searchLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.neutral[600],
  },
  noResultsText: {
    fontSize: 14,
    color: colors.neutral[600],
    textAlign: "center",
  },
  myLocationButton: {
    position: "absolute",
    right: 16,
    backgroundColor: "white",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  locationInfo: {
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.neutral[500],
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral[900],
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.neutral[700],
  },
  confirmButton: {
    flex: 2,
    flexDirection: "row",
    backgroundColor: colors.primary[600],
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
});

export default LocationPicker;
