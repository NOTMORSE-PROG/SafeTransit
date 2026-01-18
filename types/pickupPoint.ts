/**
 * Safe Meeting Point Types
 * Safety-focused meeting points for SafeTransit users
 */

export interface SafeMeetingPoint {
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

  // Safety Features
  safety_rating: number;
  has_security_guard: boolean;
  has_cctv: boolean;
  well_lit_at_night: boolean;
  high_foot_traffic: boolean;
  staffed_24_7: boolean;
  safety_notes?: string;
  user_safety_reports: number;
  positive_safety_reports: number;
  last_safety_check?: string;

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

// Legacy alias for backwards compatibility
export type PickupPoint = SafeMeetingPoint;

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
