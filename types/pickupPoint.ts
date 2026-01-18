/**
 * Pickup Point Types
 * Based on Grab's multi-entrance pickup points system
 */

export interface PickupPoint {
  id: string;
  parent_location_id: string;

  // Coordinates
  latitude: number;
  longitude: number;
  geohash: string;

  // Details
  type: 'entrance' | 'gate' | 'parking' | 'platform' | 'terminal' | 'main' | 'side';
  name: string;
  description?: string;

  // Validation
  verified: boolean;
  verified_at?: string;
  verified_by?: 'system' | 'user' | 'admin';
  verification_count: number;

  // Usage tracking
  use_count: number;
  last_used_at?: string;

  // Accessibility
  accessible: boolean;
  access_notes?: string;

  created_at: string;
  updated_at: string;
}

export interface PickupPointInsert {
  parent_location_id: string;
  latitude: number;
  longitude: number;
  type: PickupPoint['type'];
  name: string;
  description?: string;
  verified?: boolean;
  verified_by?: PickupPoint['verified_by'];
  accessible?: boolean;
  access_notes?: string;
}

export interface PickupPointWithDistance extends PickupPoint {
  distance_km?: number;
  distance_meters?: number;
}
