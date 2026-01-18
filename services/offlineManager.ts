// Offline Manager Service
// Enables basic functionality when offline (Grab-like offline support)
// Handles network state, offline queues, and data prefetching

import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { processPendingSyncs } from './savedPlacesSync';

const OFFLINE_QUEUE_KEY = '@SafeTransit:offlineQueue';
const NETWORK_STATE_KEY = '@SafeTransit:lastNetworkState';

interface QueuedAction {
  id: string;
  type: 'track_location' | 'save_place' | 'delete_place' | 'search';
  data: unknown;
  timestamp: string;
  retryCount: number;
}

interface OfflineState {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
}

/**
 * Offline Manager
 * Manages network state and offline action queues
 */
class OfflineManager {
  private isOnline: boolean = true;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private initialized: boolean = false;

  /**
   * Initialize network listener
   * Call this once on app startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Get current network state
      const state = await NetInfo.fetch();
      this.isOnline = state.isConnected ?? false;

      // Listen for network changes
      NetInfo.addEventListener(state => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected ?? false;

        // Save network state for analytics
        this.saveNetworkState({
          isOnline: this.isOnline,
          isInternetReachable: state.isInternetReachable,
          connectionType: state.type,
        });

        // If came back online, process queued actions
        if (!wasOnline && this.isOnline) {
          console.log('Network restored, processing offline queue...');
          this.processOfflineQueue();
        }

        // Notify listeners
        this.notifyListeners(this.isOnline);
      });

      this.initialized = true;
      console.log('Offline manager initialized. Online:', this.isOnline);
    } catch (error) {
      console.error('Failed to initialize offline manager:', error);
    }
  }

  /**
   * Check if device is currently online
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Add listener for network state changes
   */
  addListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of network state change
   */
  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener(isOnline);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Queue an action for when network is restored
   */
  async queueAction(
    type: QueuedAction['type'],
    data: unknown
  ): Promise<void> {
    try {
      const queue = await this.getQueue();

      const action: QueuedAction = {
        id: Date.now().toString(),
        type,
        data,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      queue.push(action);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

      console.log(`Queued offline action: ${type}`);
    } catch (error) {
      console.error('Failed to queue action:', error);
    }
  }

  /**
   * Get current offline queue
   */
  private async getQueue(): Promise<QueuedAction[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get queue:', error);
      return [];
    }
  }

  /**
   * Get queue size (for UI display)
   */
  async getQueueSize(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * Process all queued actions
   * Called automatically when network is restored
   */
  async processOfflineQueue(): Promise<void> {
    if (!this.isOnline) {
      console.log('Cannot process queue: offline');
      return;
    }

    try {
      const queue = await this.getQueue();
      if (queue.length === 0) {
        console.log('No queued actions to process');
        return;
      }

      console.log(`Processing ${queue.length} queued actions...`);

      const failedActions: QueuedAction[] = [];

      for (const action of queue) {
        try {
          await this.executeAction(action);
          console.log(`✓ Processed: ${action.type}`);
        } catch (error) {
          console.error(`✗ Failed: ${action.type}`, error);

          // Retry up to 3 times
          if (action.retryCount < 3) {
            action.retryCount += 1;
            failedActions.push(action);
          } else {
            console.log(`Giving up on action after 3 retries: ${action.type}`);
          }
        }
      }

      // Update queue with only failed actions (for retry)
      await AsyncStorage.setItem(
        OFFLINE_QUEUE_KEY,
        JSON.stringify(failedActions)
      );

      // Also process saved places sync queue
      await processPendingSyncs();

      console.log(`Queue processing complete. ${failedActions.length} actions remaining.`);
    } catch (error) {
      console.error('Failed to process offline queue:', error);
    }
  }

  /**
   * Execute a queued action
   */
  private async executeAction(action: QueuedAction): Promise<void> {
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    const token = await AsyncStorage.getItem('auth_token');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    switch (action.type) {
      case 'track_location':
        await fetch(`${API_BASE_URL}/api/user/track-location`, {
          method: 'POST',
          headers,
          body: JSON.stringify(action.data),
        });
        break;

      case 'save_place':
        await fetch(`${API_BASE_URL}/api/user/saved-places`, {
          method: 'POST',
          headers,
          body: JSON.stringify(action.data),
        });
        break;

      case 'delete_place':
        await fetch(
          `${API_BASE_URL}/api/user/saved-places?id=${(action.data as { id: string }).id}`,
          {
            method: 'DELETE',
            headers,
          }
        );
        break;

      default:
        console.log(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Clear all queued actions
   */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  }

  /**
   * Save network state for analytics
   */
  private async saveNetworkState(state: OfflineState): Promise<void> {
    try {
      await AsyncStorage.setItem(NETWORK_STATE_KEY, JSON.stringify({
        ...state,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to save network state:', error);
    }
  }

  /**
   * Get last known network state
   */
  async getLastNetworkState(): Promise<OfflineState | null> {
    try {
      const data = await AsyncStorage.getItem(NETWORK_STATE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get network state:', error);
      return null;
    }
  }

  /**
   * Force sync now (user-triggered)
   */
  async forceSyncNow(): Promise<{ success: boolean; processed: number }> {
    if (!this.isOnline) {
      return { success: false, processed: 0 };
    }

    const queueSize = await this.getQueueSize();
    await this.processOfflineQueue();
    const remainingSize = await this.getQueueSize();

    return {
      success: true,
      processed: queueSize - remainingSize,
    };
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager();

// Export helper functions
export const isOnline = () => offlineManager.getIsOnline();
export const queueOfflineAction = (type: QueuedAction['type'], data: unknown) =>
  offlineManager.queueAction(type, data);
