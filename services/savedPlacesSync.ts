// Saved Places Sync Service
// Implements Grab-like cloud sync for saved places (14M users, 45M saved places)
// Syncs between AsyncStorage (local) and PostgreSQL backend (cloud)

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavedPlace } from './locationStorage';

/**
 * Get auth token from AsyncStorage
 */
async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const SYNC_STATUS_KEY = '@SafeTransit:savedPlacesSyncStatus';
const PENDING_SYNC_KEY = '@SafeTransit:pendingSavedPlacesSync';

interface SyncStatus {
  lastSyncAt: string | null;
  lastSyncSuccess: boolean;
  pendingChanges: number;
}

interface ServerSavedPlace {
  id: string;
  label: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  geohash: string;
  useCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert server format to local SavedPlace format
 */
function serverToLocal(serverPlace: ServerSavedPlace): SavedPlace {
  return {
    id: serverPlace.id,
    type: serverPlace.label as 'home' | 'work' | 'favorite',
    name: serverPlace.name,
    address: serverPlace.address,
    latitude: serverPlace.latitude,
    longitude: serverPlace.longitude,
    createdAt: serverPlace.createdAt,
  };
}

/**
 * Convert local SavedPlace to server format
 */
function localToServer(localPlace: SavedPlace) {
  return {
    label: localPlace.type,
    name: localPlace.name,
    address: localPlace.address,
    latitude: localPlace.latitude,
    longitude: localPlace.longitude,
    updated_at: localPlace.createdAt,
  };
}

/**
 * Get sync status
 */
async function getSyncStatus(): Promise<SyncStatus> {
  try {
    const status = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    return status
      ? JSON.parse(status)
      : { lastSyncAt: null, lastSyncSuccess: false, pendingChanges: 0 };
  } catch {
    return { lastSyncAt: null, lastSyncSuccess: false, pendingChanges: 0 };
  }
}

/**
 * Update sync status
 */
async function updateSyncStatus(
  success: boolean,
  pendingChanges: number = 0
): Promise<void> {
  const status: SyncStatus = {
    lastSyncAt: new Date().toISOString(),
    lastSyncSuccess: success,
    pendingChanges,
  };
  await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
}

/**
 * Sync saved places from server to local (pull)
 * Called on app launch when user is logged in
 */
export async function syncFromServer(): Promise<SavedPlace[]> {
  try {
    const token = await getToken();
    if (!token) {
      console.log('No auth token, skipping sync');
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/api/user/saved-places`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('Unauthorized, user may need to re-login');
      }
      throw new Error(`Sync failed: ${response.status}`);
    }

    const data = await response.json();
    const serverPlaces: ServerSavedPlace[] = data.places || [];

    // Convert server format to local format
    const localPlaces = serverPlaces.map(serverToLocal);

    // Update local storage
    const SAVED_PLACES_KEY = '@SafeTransit:savedPlaces';
    await AsyncStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(localPlaces));

    // Update sync status
    await updateSyncStatus(true, 0);

    console.log(`Synced ${localPlaces.length} saved places from server`);
    return localPlaces;
  } catch (error) {
    console.error('Sync from server failed:', error);
    await updateSyncStatus(false);
    return [];
  }
}

/**
 * Push a saved place to server (create or update)
 */
export async function pushSavedPlaceToServer(
  place: SavedPlace
): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) {
      console.log('No auth token, queueing for later sync');
      await queueForSync('create', place);
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/api/user/saved-places`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(localToServer(place)),
    });

    if (!response.ok) {
      throw new Error(`Push failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Saved place synced to server:', data.place.label);
    return true;
  } catch (error) {
    console.error('Push to server failed:', error);
    await queueForSync('create', place);
    return false;
  }
}

/**
 * Delete a saved place from server
 */
export async function deleteSavedPlaceFromServer(
  placeId: string
): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) {
      console.log('No auth token, queueing delete for later sync');
      await queueForSync('delete', { id: placeId });
      return false;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/user/saved-places?id=${placeId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }

    console.log('Saved place deleted from server');
    return true;
  } catch (error) {
    console.error('Delete from server failed:', error);
    await queueForSync('delete', { id: placeId });
    return false;
  }
}

/**
 * Record usage of a saved place
 * Updates use_count and last_used_at on server
 */
export async function recordPlaceUse(placeId: string): Promise<void> {
  try {
    const token = await getToken();
    if (!token) return;

    await fetch(`${API_BASE_URL}/api/user/saved-places?id=${placeId}&recordUse=true`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    // Silent fail - usage tracking is not critical
    console.error('Record place use failed:', error);
  }
}

/**
 * Queue action for later sync when offline or not authenticated
 */
async function queueForSync(
  action: 'create' | 'delete',
  data: unknown
): Promise<void> {
  try {
    const queue = await AsyncStorage.getItem(PENDING_SYNC_KEY);
    const pending = queue ? JSON.parse(queue) : [];

    pending.push({
      action,
      data,
      timestamp: new Date().toISOString(),
    });

    await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));

    // Update pending count
    const status = await getSyncStatus();
    await updateSyncStatus(status.lastSyncSuccess, pending.length);
  } catch (error) {
    console.error('Failed to queue sync action:', error);
  }
}

/**
 * Process pending sync queue
 * Should be called when user logs in or comes back online
 */
export async function processPendingSyncs(): Promise<void> {
  try {
    const token = await getToken();
    if (!token) return;

    const queue = await AsyncStorage.getItem(PENDING_SYNC_KEY);
    if (!queue) return;

    const pending = JSON.parse(queue);
    if (pending.length === 0) return;

    console.log(`Processing ${pending.length} pending syncs...`);

    for (const item of pending) {
      try {
        if (item.action === 'create') {
          await pushSavedPlaceToServer(item.data);
        } else if (item.action === 'delete') {
          await deleteSavedPlaceFromServer(item.data.id);
        }
      } catch (error) {
        console.error('Failed to process pending sync:', error);
        // Continue with other items
      }
    }

    // Clear queue
    await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify([]));
    await updateSyncStatus(true, 0);

    console.log('Pending syncs processed successfully');
  } catch (error) {
    console.error('Process pending syncs failed:', error);
  }
}

/**
 * Bulk sync - useful for initial sync or migration
 * Compares local and server data and merges intelligently
 */
export async function bulkSync(localPlaces: SavedPlace[]): Promise<void> {
  try {
    const token = await getToken();
    if (!token) {
      console.log('No auth token, skipping bulk sync');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/user/saved-places`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bulkSync: true,
        places: localPlaces.map(localToServer),
      }),
    });

    if (!response.ok) {
      throw new Error(`Bulk sync failed: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Bulk synced ${data.synced} places`);

    // Update local storage with merged results
    const syncedPlaces = data.places.map(serverToLocal);
    const SAVED_PLACES_KEY = '@SafeTransit:savedPlaces';
    await AsyncStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(syncedPlaces));

    await updateSyncStatus(true, 0);
  } catch (error) {
    console.error('Bulk sync failed:', error);
    await updateSyncStatus(false);
  }
}

/**
 * Get sync status for display in UI
 */
export async function getSyncStatusForUI(): Promise<{
  isInSync: boolean;
  lastSyncAt: string | null;
  pendingChanges: number;
}> {
  const status = await getSyncStatus();
  return {
    isInSync: status.lastSyncSuccess && status.pendingChanges === 0,
    lastSyncAt: status.lastSyncAt,
    pendingChanges: status.pendingChanges,
  };
}
