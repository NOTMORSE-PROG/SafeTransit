// Location Storage Service
// Using AsyncStorage for local data persistence
// Can be upgraded to sync with PostgreSQL backend later

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedPlace {
  id: string;
  type: 'home' | 'work' | 'favorite';
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface RecentLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  searchCount: number;
  lastSearchedAt: string;
}

const SAVED_PLACES_KEY = '@SafeTransit:savedPlaces';
const RECENT_LOCATIONS_KEY = '@SafeTransit:recentLocations';
const MAX_RECENT_LOCATIONS = 20;

/**
 * Get all saved places
 */
export async function getSavedPlaces(): Promise<SavedPlace[]> {
  try {
    const data = await AsyncStorage.getItem(SAVED_PLACES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading saved places:', error);
    return [];
  }
}

/**
 * Save a place (Home, Work, or Favorite)
 */
export async function savePlace(place: Omit<SavedPlace, 'id' | 'createdAt'>): Promise<SavedPlace> {
  try {
    const places = await getSavedPlaces();

    // Check if place type already exists (only one home/work allowed)
    if (place.type === 'home' || place.type === 'work') {
      const existingIndex = places.findIndex((p) => p.type === place.type);
      if (existingIndex >= 0) {
        places.splice(existingIndex, 1);
      }
    }

    const newPlace: SavedPlace = {
      ...place,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    places.push(newPlace);
    await AsyncStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(places));

    return newPlace;
  } catch (error) {
    console.error('Error saving place:', error);
    throw error;
  }
}

/**
 * Delete a saved place
 */
export async function deleteSavedPlace(id: string): Promise<void> {
  try {
    const places = await getSavedPlaces();
    const filtered = places.filter((p) => p.id !== id);
    await AsyncStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting saved place:', error);
    throw error;
  }
}

/**
 * Get saved place by type
 */
export async function getSavedPlaceByType(type: 'home' | 'work'): Promise<SavedPlace | null> {
  try {
    const places = await getSavedPlaces();
    return places.find((p) => p.type === type) || null;
  } catch (error) {
    console.error('Error getting saved place:', error);
    return null;
  }
}

/**
 * Get recent locations
 */
export async function getRecentLocations(): Promise<RecentLocation[]> {
  try {
    const data = await AsyncStorage.getItem(RECENT_LOCATIONS_KEY);
    const locations: RecentLocation[] = data ? JSON.parse(data) : [];

    // Sort by last searched (most recent first)
    return locations.sort((a, b) =>
      new Date(b.lastSearchedAt).getTime() - new Date(a.lastSearchedAt).getTime()
    );
  } catch (error) {
    console.error('Error loading recent locations:', error);
    return [];
  }
}

/**
 * Add location to recent searches
 */
export async function addRecentLocation(
  location: Omit<RecentLocation, 'id' | 'searchCount' | 'lastSearchedAt'>
): Promise<void> {
  try {
    const locations = await getRecentLocations();

    // Check if location already exists (match by coordinates)
    const existingIndex = locations.findIndex(
      (l) =>
        Math.abs(l.latitude - location.latitude) < 0.0001 &&
        Math.abs(l.longitude - location.longitude) < 0.0001
    );

    if (existingIndex >= 0) {
      // Update existing location
      locations[existingIndex].searchCount += 1;
      locations[existingIndex].lastSearchedAt = new Date().toISOString();
      locations[existingIndex].name = location.name;
      locations[existingIndex].address = location.address;
    } else {
      // Add new location
      const newLocation: RecentLocation = {
        ...location,
        id: Date.now().toString(),
        searchCount: 1,
        lastSearchedAt: new Date().toISOString(),
      };

      locations.push(newLocation);
    }

    // Keep only the most recent locations
    const trimmed = locations
      .sort((a, b) => new Date(b.lastSearchedAt).getTime() - new Date(a.lastSearchedAt).getTime())
      .slice(0, MAX_RECENT_LOCATIONS);

    await AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error adding recent location:', error);
  }
}

/**
 * Clear all recent locations
 */
export async function clearRecentLocations(): Promise<void> {
  try {
    await AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('Error clearing recent locations:', error);
    throw error;
  }
}

/**
 * Clear all data (for development/testing)
 */
export async function clearAllLocationData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([SAVED_PLACES_KEY, RECENT_LOCATIONS_KEY]);
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
}
