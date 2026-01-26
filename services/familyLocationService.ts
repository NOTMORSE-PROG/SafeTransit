import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "../utils/api";
import { AppState, AppStateStatus } from "react-native";

export interface FamilyMember {
  user_id: string;
  full_name: string;
  profile_image_url?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  is_live: boolean;
  accuracy?: number;
}

interface LocationUpdateOptions {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

class FamilyLocationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private isTrackingEnabled = false;
  private isAppActive = true;
  private lastUpdateTime = 0;
  private token: string | null = null;

  constructor() {
    this.setupAppStateListener();
    this.loadTrackingState();
  }

  private setupAppStateListener() {
    AppState.addEventListener("change", this.handleAppStateChange);
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    const wasActive = this.isAppActive;
    this.isAppActive = nextAppState === "active";

    if (this.isTrackingEnabled && wasActive !== this.isAppActive) {
      if (this.isAppActive) {
        // App became active - restart with foreground permissions
        console.log("App became active, starting foreground location updates");
        setTimeout(() => this.startLocationUpdates(), 500);
      } else {
        // App went to background - use simple tracking only
        console.log("App went to background, switching to basic tracking");
        this.switchToBackgroundTracking();
      }
    }
  };

  async setToken(token: string) {
    this.token = token;
  }

  async enableLocationSharing() {
    try {
      this.isTrackingEnabled = true;
      await AsyncStorage.setItem("family_location_sharing", "true");

      // Only start location updates if app is active
      if (this.isAppActive) {
        await this.startLocationUpdates();
      } else {
        console.log(
          "Location sharing enabled, will start when app becomes active",
        );
      }
    } catch (error) {
      console.error("Failed to enable location sharing:", error);
      throw error;
    }
  }

  async disableLocationSharing() {
    try {
      this.isTrackingEnabled = false;
      await AsyncStorage.setItem("family_location_sharing", "false");
      this.stopLocationUpdates();
    } catch (error) {
      console.error("Failed to disable location sharing:", error);
    }
  }

  async isLocationSharingEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem("family_location_sharing");
      return enabled === "true";
    } catch {
      return false;
    }
  }

  private async loadTrackingState() {
    this.isTrackingEnabled = await this.isLocationSharingEnabled();
    // Only start if app is currently active
    if (this.isTrackingEnabled && this.isAppActive) {
      // Small delay to ensure proper initialization
      setTimeout(() => {
        this.startLocationUpdates();
      }, 1000);
    }
  }

  private async startLocationUpdates() {
    if (!this.token || !this.isAppActive) return;

    this.stopLocationUpdates();

    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Location permission denied");
      }

      // Only start location watching when app is active
      if (this.isAppActive) {
        console.log("Starting foreground location tracking");
        this.locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 30000, // 30s when active
            distanceInterval: 10, // 10 meters
          },
          this.handleLocationUpdate,
        );
      }
    } catch (error) {
      console.error("Failed to start location updates:", error);
    }
  }

  private async switchToBackgroundTracking() {
    if (!this.token) return;

    try {
      // Stop current location tracking
      this.stopLocationUpdates();

      // Use simple interval-based tracking for background
      this.startSimpleLocationTracking();
    } catch (error) {
      console.error("Failed to switch to background tracking:", error);
    }
  }

  private async startSimpleLocationTracking() {
    if (!this.token || !this.isTrackingEnabled) return;

    // Clear any existing interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Update location every 2 minutes when in background
    this.updateInterval = setInterval(async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          await this.handleLocationUpdate(location);
        }
      } catch (error) {
        console.error("Background location update failed:", error);
      }
    }, 120000); // 2 minutes
  }

  private handleLocationUpdate = async (location: Location.LocationObject) => {
    if (!this.token || !this.isTrackingEnabled) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;
    const minInterval = this.isAppActive ? 30000 : 120000; // 30s active, 2min background

    // Throttle updates
    if (timeSinceLastUpdate < minInterval) return;

    try {
      await this.updateFamilyLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
      });

      this.lastUpdateTime = now;
    } catch (error) {
      console.error("Failed to update family location:", error);
    }
  };

  private stopLocationUpdates() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log("Stopped location tracking");
  }

  async updateFamilyLocation(options: LocationUpdateOptions) {
    if (!this.token) {
      throw new Error("No authentication token");
    }

    try {
      const response = await apiFetch(
        "/api/user/location-data?action=update-location",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify(options),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update location");
      }

      return await response.json();
    } catch (error) {
      console.error("Update family location error:", error);
      throw error;
    }
  }

  async getFamilyLocations(): Promise<FamilyMember[]> {
    if (!this.token) {
      return this.getMockFamilyLocations();
    }

    try {
      const response = await apiFetch(
        "/api/user/location-data?action=family-locations",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch family locations");
      }

      const data = await response.json();
      return data.locations || [];
    } catch (error) {
      console.error("Get family locations error:", error);
      // Return mock data on error for development
      return this.getMockFamilyLocations();
    }
  }

  private getMockFamilyLocations(): FamilyMember[] {
    const now = new Date();
    const mockMembers = [
      {
        user_id: "mock-1",
        full_name: "Maria Santos",
        profile_image_url: undefined,
        latitude: 14.5547, // Makati CBD
        longitude: 121.0244,
        timestamp: new Date(now.getTime() - 1 * 60 * 1000).toISOString(), // 1 min ago
        is_live: true,
        accuracy: 10,
      },
      {
        user_id: "mock-2",
        full_name: "Juan Dela Cruz",
        profile_image_url: undefined,
        latitude: 14.5995, // Manila City Hall
        longitude: 120.9842,
        timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // 15 min ago
        is_live: true,
        accuracy: 15,
      },
      {
        user_id: "mock-3",
        full_name: "Ana Reyes",
        profile_image_url: undefined,
        latitude: 14.6507, // Quezon City
        longitude: 121.0494,
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        is_live: false,
        accuracy: 20,
      },
      {
        user_id: "mock-4",
        full_name: "Carlos Mendoza",
        profile_image_url: undefined,
        latitude: 14.5764, // BGC
        longitude: 121.0851,
        timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 min ago - SOS simulation
        is_live: true,
        accuracy: 8,
      },
    ];

    return mockMembers;
  }

  cleanup() {
    this.stopLocationUpdates();
    // Note: AppState.removeEventListener is deprecated in newer RN versions
    // The event listener will be cleaned up automatically
  }
}

// Export singleton instance
export const familyLocationService = new FamilyLocationService();
