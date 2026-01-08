import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Home, Briefcase, Clock, Star, X, Locate, ChevronLeft } from 'lucide-react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import {
  searchLocations,
  LocationSearchResult,
} from '../services/nominatim';
import {
  getSavedPlaces,
  getRecentLocations,
  addRecentLocation,
  SavedPlace,
  RecentLocation,
} from '../services/locationStorage';

interface LocationSearchInputProps {
  placeholder: string;
  value: string;
  onLocationSelect: (location: LocationSearchResult) => void;
  onChangeText?: (text: string) => void;
  icon?: 'start' | 'end';
  showCurrentLocation?: boolean;
  onUseCurrentLocation?: () => void;
  autoFocus?: boolean;
}

export default function LocationSearchInput({
  placeholder,
  value,
  onLocationSelect,
  onChangeText,
  icon = 'end',
  showCurrentLocation = false,
  onUseCurrentLocation,
}: LocationSearchInputProps) {
  const insets = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isFocused) {
      loadSavedData();
    }
  }, [isFocused]);

  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  const loadSavedData = async () => {
    const [saved, recent] = await Promise.all([
      getSavedPlaces(),
      getRecentLocations(),
    ]);
    setSavedPlaces(saved);
    setRecentLocations(recent.slice(0, 5));
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    onChangeText?.(query);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);

    searchTimeout.current = setTimeout(async () => {
      const results = await searchLocations(query, 8);
      setSearchResults(results);
      setIsLoading(false);
    }, 300);
  };

  const handleSelectLocation = async (location: LocationSearchResult | SavedPlace | RecentLocation) => {
    const selectedLocation: LocationSearchResult = {
      id: location.id || Date.now().toString(),
      name: location.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      type: 'type' in location ? location.type : 'location',
    };

    // Save to recent locations
    await addRecentLocation(selectedLocation);

    setSearchQuery(location.name);
    onLocationSelect(selectedLocation);
    setIsFocused(false);
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    onChangeText?.('');
  };

  const iconColor = icon === 'start' ? '#2563eb' : '#dc2626';

  return (
    <>
      {/* Search Input (Collapsed) */}
      <TouchableOpacity
        onPress={() => setIsFocused(true)}
        className="flex-row items-center bg-neutral-100 rounded-xl px-3 py-3"
        activeOpacity={0.9}
      >
        {icon === 'start' && (
          <View className="w-3 h-3 rounded-full bg-primary-600 mr-2" />
        )}
        {icon === 'end' && (
          <MapPin color={iconColor} size={20} strokeWidth={2} />
        )}

        <Text
          className={`flex-1 text-base ml-2 ${
            searchQuery ? 'text-neutral-900' : 'text-neutral-400'
          }`}
        >
          {searchQuery || placeholder}
        </Text>

        {showCurrentLocation && !searchQuery && (
          <Locate color="#2563eb" size={20} strokeWidth={2} />
        )}
      </TouchableOpacity>

      {/* Full-Screen Search Modal */}
      <Modal
        visible={isFocused}
        animationType="slide"
        onRequestClose={() => {
          setIsFocused(false);
          Keyboard.dismiss();
        }}
      >
        <View className="flex-1 bg-white">
          <Animated.View entering={SlideInUp.duration(300)} className="flex-1">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-neutral-200" style={{ paddingTop: insets.top + 8 }}>
              <TouchableOpacity
                onPress={() => {
                  setIsFocused(false);
                  Keyboard.dismiss();
                }}
                className="mr-3 p-1"
                activeOpacity={0.7}
              >
                <ChevronLeft color="#111827" size={28} strokeWidth={2} />
              </TouchableOpacity>

              <View className="flex-1 flex-row items-center bg-neutral-100 rounded-xl px-3 py-2">
                {icon === 'start' && (
                  <View className="w-3 h-3 rounded-full bg-primary-600 mr-2" />
                )}
                {icon === 'end' && (
                  <MapPin color={iconColor} size={20} strokeWidth={2} />
                )}

                <TextInput
                  placeholder={placeholder}
                  value={searchQuery}
                  onChangeText={handleSearch}
                  className="flex-1 text-base text-neutral-900 ml-2"
                  placeholderTextColor="#9CA3AF"
                  autoFocus={true}
                />

                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={handleClear}
                    className="ml-2 p-1"
                    activeOpacity={0.7}
                  >
                    <X color="#6b7280" size={18} strokeWidth={2} />
                  </TouchableOpacity>
                )}

                {isLoading && (
                  <ActivityIndicator size="small" color="#2563eb" className="ml-2" />
                )}
              </View>
            </View>

            {/* Use Current Location Button */}
            {showCurrentLocation && (
              <TouchableOpacity
                onPress={() => {
                  onUseCurrentLocation?.();
                  setIsFocused(false);
                }}
                className="flex-row items-center px-4 py-4 border-b border-neutral-100"
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3">
                  <Locate color="#2563eb" size={20} strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-primary-600">
                    Use Current Location
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Search Results */}
            <FlatList
              data={[
                ...(searchQuery.trim().length === 0 ? savedPlaces : []),
                ...(searchQuery.trim().length === 0 ? recentLocations : []),
                ...searchResults,
              ]}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 20 }}
              ListEmptyComponent={
                <View className="p-8">
                  <Text className="text-sm text-neutral-500 text-center">
                    {searchQuery.trim().length === 0
                      ? 'Start typing to search for locations'
                      : 'No locations found'}
                  </Text>
                </View>
              }
              renderItem={({ item, index }) => {
                const isSaved = 'type' in item && (item.type === 'home' || item.type === 'work' || item.type === 'favorite');
                const isRecent = 'searchCount' in item;

                let ItemIcon = MapPin;
                let itemIconColor = '#6b7280';

                if (isSaved) {
                  const place = item as SavedPlace;
                  if (place.type === 'home') {
                    ItemIcon = Home;
                    itemIconColor = '#2563eb';
                  } else if (place.type === 'work') {
                    ItemIcon = Briefcase;
                    itemIconColor = '#7c3aed';
                  } else {
                    ItemIcon = Star;
                    itemIconColor = '#eab308';
                  }
                } else if (isRecent) {
                  ItemIcon = Clock;
                  itemIconColor = '#9ca3af';
                }

                return (
                  <TouchableOpacity
                    onPress={() => handleSelectLocation(item)}
                    className={`flex-row items-center px-4 py-3 ${
                      index > 0 ? 'border-t border-neutral-100' : ''
                    }`}
                    activeOpacity={0.7}
                  >
                    <View className="w-10 h-10 bg-neutral-100 rounded-full items-center justify-center mr-3">
                      <ItemIcon color={itemIconColor} size={20} strokeWidth={2} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-neutral-900" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text className="text-sm text-neutral-500 mt-0.5" numberOfLines={2}>
                        {item.address}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}
