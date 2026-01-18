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
  formatDistanceDisplay,
} from '../services/nominatim';
import * as ExpoLocation from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  initiallyExpanded?: boolean;
  onClose?: () => void;
  showSelectOnMap?: boolean;
  onSelectOnMap?: () => void;
}

type TabType = 'recent' | 'saved';

export default function LocationSearchInput({
  placeholder,
  value,
  onLocationSelect,
  onChangeText,
  icon = 'end',
  showCurrentLocation = false,
  onUseCurrentLocation,
  initiallyExpanded = false,
  onClose,
  showSelectOnMap = false,
  onSelectOnMap,
}: LocationSearchInputProps) {
  const insets = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(initiallyExpanded);
  const [searchQuery, setSearchQuery] = useState(value);
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get user location on mount for proximity-based search (Grab-like)
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const location = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced,
        });

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting user location:', error);
      }
    };

    getUserLocation();
  }, []);

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
    setRecentLocations(recent.slice(0, 10));
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

    // Debounce search (300ms) with user location and auth for personalized ranking
    searchTimeout.current = setTimeout(async () => {
      // Get auth token for personalized search (Grab-like user history ranking)
      const authToken = await AsyncStorage.getItem('auth_token');

      const results = await searchLocations(
        query,
        userLocation || undefined, // Proximity ranking
        10,
        authToken // User personalization ranking
      );
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

  // Get data based on active tab when not searching
  const getTabData = (): (SavedPlace | RecentLocation)[] => {
    if (activeTab === 'saved') {
      return savedPlaces;
    }
    return recentLocations;
  };

  // Render tab bar
  const renderTabs = () => (
    <View className="flex-row border-b border-neutral-100">
      <TouchableOpacity
        onPress={() => setActiveTab('recent')}
        className={`flex-1 py-3 items-center ${activeTab === 'recent' ? 'border-b-2 border-primary-600' : ''}`}
        activeOpacity={0.7}
      >
        <Text className={`text-sm font-semibold ${activeTab === 'recent' ? 'text-primary-600' : 'text-neutral-400'}`}>
          Recent
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setActiveTab('saved')}
        className={`flex-1 py-3 items-center ${activeTab === 'saved' ? 'border-b-2 border-primary-600' : ''}`}
        activeOpacity={0.7}
      >
        <Text className={`text-sm font-semibold ${activeTab === 'saved' ? 'text-primary-600' : 'text-neutral-400'}`}>
          Saved
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render section header
  const renderSectionHeader = (title: string) => (
    <View className="px-4 py-2 bg-neutral-50">
      <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
        {title}
      </Text>
    </View>
  );

  // Loading skeleton component
  const SearchResultSkeleton = () => (
    <View className="px-4 py-3">
      <View className="flex-row items-center">
        <View className="w-10 h-10 bg-neutral-200 rounded-full mr-3" />
        <View className="flex-1">
          <View className="w-3/4 h-4 bg-neutral-200 rounded mb-2" />
          <View className="w-1/2 h-3 bg-neutral-200 rounded" />
        </View>
      </View>
    </View>
  );

  // Render location item with distance (Grab-like)
  const renderLocationItem = (item: SavedPlace | RecentLocation | LocationSearchResult, index: number) => {
    const isSaved = 'type' in item && (item.type === 'home' || item.type === 'work' || item.type === 'favorite');
    const isRecent = 'searchCount' in item;
    const hasDistance = 'distance_km' in item && (item as LocationSearchResult).distance_km !== undefined;
    const distance = hasDistance ? formatDistanceDisplay((item as LocationSearchResult).distance_km) : '';

    let ItemIcon = MapPin;
    let itemIconColor = '#6b7280';
    let itemIconBgColor = 'bg-neutral-100';

    if (isSaved) {
      const place = item as SavedPlace;
      if (place.type === 'home') {
        ItemIcon = Home;
        itemIconColor = '#2563eb';
        itemIconBgColor = 'bg-primary-50';
      } else if (place.type === 'work') {
        ItemIcon = Briefcase;
        itemIconColor = '#7c3aed';
        itemIconBgColor = 'bg-violet-50';
      } else {
        ItemIcon = Star;
        itemIconColor = '#eab308';
        itemIconBgColor = 'bg-yellow-50';
      }
    } else if (isRecent) {
      ItemIcon = Clock;
      itemIconColor = '#9ca3af';
    }

    return (
      <TouchableOpacity
        onPress={() => handleSelectLocation(item)}
        className={`flex-row items-center px-4 py-3 ${
          index > 0 ? 'border-t border-neutral-50' : ''
        } active:bg-neutral-50`}
        activeOpacity={0.7}
      >
        <View className={`w-10 h-10 ${itemIconBgColor} rounded-full items-center justify-center mr-3`}>
          <ItemIcon color={itemIconColor} size={20} strokeWidth={2} />
        </View>
        <View className="flex-1 mr-2">
          <Text className="text-base font-semibold text-neutral-900" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-sm text-neutral-500 mt-0.5" numberOfLines={1}>
            {item.address}
          </Text>
        </View>
        {/* Distance indicator (Grab-like) */}
        {distance ? (
          <View className="items-end">
            <Text className="text-sm font-medium text-primary-600">
              {distance}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

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
          onClose?.();
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
                  onClose?.();
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

            {/* Quick Actions */}
            {(showCurrentLocation || showSelectOnMap) && (
              <View className="border-b border-neutral-100">
                {showCurrentLocation && (
                  <TouchableOpacity
                    onPress={() => {
                      onUseCurrentLocation?.();
                      setIsFocused(false);
                    }}
                    className="flex-row items-center px-4 py-4"
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
                {showSelectOnMap && (
                  <TouchableOpacity
                    onPress={() => {
                      setIsFocused(false);
                      onSelectOnMap?.();
                    }}
                    className="flex-row items-center px-4 py-4"
                    activeOpacity={0.7}
                  >
                    <View className="w-10 h-10 bg-neutral-100 rounded-full items-center justify-center mr-3">
                      <MapPin color="#6b7280" size={20} strokeWidth={2} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-neutral-700">
                        Select on Map
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Tabs - Only show when not searching */}
            {searchQuery.trim().length === 0 && renderTabs()}

            {/* Loading Skeletons */}
            {isLoading && searchQuery.trim().length > 0 && (
              <View>
                <SearchResultSkeleton />
                <SearchResultSkeleton />
                <SearchResultSkeleton />
              </View>
            )}

            {/* Search Results or Tab Content */}
            <FlatList<SavedPlace | RecentLocation | LocationSearchResult>
              data={searchQuery.trim().length > 0 ? searchResults : getTabData()}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 20 }}
              ListHeaderComponent={
                searchQuery.trim().length > 0 ? (
                  // Active search mode: Only show "Search Results" header
                  searchResults.length > 0 ? renderSectionHeader('Search Results') : null
                ) : (
                  // Browse mode: Show tab-specific headers
                  <View>
                    {activeTab === 'recent' && recentLocations.length > 0 && (
                      renderSectionHeader('Recent Searches')
                    )}
                    {activeTab === 'saved' && savedPlaces.length > 0 && (
                      renderSectionHeader('Saved Places')
                    )}
                  </View>
                )
              }
              ListEmptyComponent={
                !isLoading ? (
                  <View className="p-8 items-center">
                    {searchQuery.trim().length === 0 ? (
                      <>
                        <View className="w-16 h-16 bg-neutral-100 rounded-full items-center justify-center mb-4">
                          {activeTab === 'recent' ? (
                            <Clock color="#9ca3af" size={32} />
                          ) : (
                            <Star color="#9ca3af" size={32} />
                          )}
                        </View>
                        <Text className="text-base font-semibold text-neutral-700 mb-1">
                          {activeTab === 'recent' ? 'No recent searches' : 'No saved places'}
                        </Text>
                        <Text className="text-sm text-neutral-400 text-center">
                          {activeTab === 'recent'
                            ? 'Your recent searches will appear here'
                            : 'Save your favorite places for quick access'}
                        </Text>
                      </>
                    ) : (
                      <>
                        <View className="w-16 h-16 bg-neutral-100 rounded-full items-center justify-center mb-4">
                          <MapPin color="#9ca3af" size={32} />
                        </View>
                        <Text className="text-base font-semibold text-neutral-700 mb-1">
                          No locations found
                        </Text>
                        <Text className="text-sm text-neutral-400 text-center">
                          Try a different search term
                        </Text>
                      </>
                    )}
                  </View>
                ) : null
              }
              renderItem={({ item, index }) => renderLocationItem(item, index)}
            />
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}
