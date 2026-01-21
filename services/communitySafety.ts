/**
 * Community Safety Reporting Service
 * User-reported unsafe areas and safety incidents
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://safetransit-backend.vercel.app';

export type SafetyReportType =
  | 'unsafe_area'
  | 'theft'
  | 'harassment'
  | 'assault'
  | 'poor_lighting'
  | 'suspicious_activity'
  | 'safe_area'
  | 'well_lit'
  | 'police_presence';

export interface SafetyReport {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  location_name?: string;
  report_type: SafetyReportType;
  severity: 1 | 2 | 3;
  description?: string;
  time_of_incident?: string;
  verified: boolean;
  verification_count: number;
  upvotes: number;
  downvotes: number;
  helpful_count: number;
  status: 'active' | 'resolved' | 'archived' | 'spam';
  created_at: string;
  updated_at: string;
  distance_km?: number;
}

export interface CreateSafetyReport {
  latitude: number;
  longitude: number;
  location_name?: string;
  report_type: SafetyReportType;
  severity: 1 | 2 | 3;
  description?: string;
  time_of_incident?: string;
}

export interface SafetyHeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
}

/**
 * Report a safety incident
 */
export async function reportSafetyIncident(
  report: CreateSafetyReport
): Promise<SafetyReport> {
  const token = await AsyncStorage.getItem('@auth_token');

  const response = await fetch(`${API_BASE_URL}/api/safety/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(report)
  });

  if (!response.ok) {
    throw new Error('Failed to submit safety report');
  }

  return await response.json();
}

/**
 * Get nearby safety reports
 */
export async function getNearbyReports(
  latitude: number,
  longitude: number,
  radiusKm: number = 2,
  hoursAgo: number = 168
): Promise<SafetyReport[]> {
  const params = new URLSearchParams({
    lat: latitude.toString(),
    lon: longitude.toString(),
    radius: radiusKm.toString(),
    hours: hoursAgo.toString()
  });

  const response = await fetch(
    `${API_BASE_URL}/api/safety/reports/nearby?${params}`
  );

  if (!response.ok) {
    return [];
  }

  return await response.json();
}

/**
 * Get safety heatmap data
 */
export async function getSafetyHeatmap(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}): Promise<SafetyHeatmapPoint[]> {
  const params = new URLSearchParams({
    north: bounds.north.toString(),
    south: bounds.south.toString(),
    east: bounds.east.toString(),
    west: bounds.west.toString()
  });

  const response = await fetch(
    `${API_BASE_URL}/api/safety/heatmap?${params}`
  );

  if (!response.ok) {
    return [];
  }

  return await response.json();
}

/**
 * Vote on a safety report
 */
export async function voteOnReport(
  reportId: string,
  voteType: 'upvote' | 'downvote' | 'helpful'
): Promise<void> {
  const token = await AsyncStorage.getItem('@auth_token');

  const response = await fetch(
    `${API_BASE_URL}/api/safety/reports/${reportId}/vote`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({ vote_type: voteType })
    }
  );

  if (!response.ok) {
    throw new Error('Failed to vote on report');
  }
}

/**
 * Get user's safety reports
 */
export async function getUserReports(): Promise<SafetyReport[]> {
  const token = await AsyncStorage.getItem('@auth_token');

  const response = await fetch(`${API_BASE_URL}/api/safety/reports/user`, {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });

  if (!response.ok) {
    return [];
  }

  return await response.json();
}

/**
 * Calculate safety score for an area
 * Returns 1-5 (1=very unsafe, 5=very safe)
 */
export function calculateAreaSafetyScore(reports: SafetyReport[]): number {
  if (reports.length === 0) return 3;

  let totalScore = 0;
  let totalWeight = 0;

  for (const report of reports) {
    const age = Date.now() - new Date(report.created_at).getTime();
    const hoursSinceReport = age / (1000 * 60 * 60);

    const recencyWeight = Math.max(0, 1 - (hoursSinceReport / 168));
    const verificationWeight = report.verified ? 1.5 : 1;
    const weight = recencyWeight * verificationWeight;

    let score: number;
    if (['safe_area', 'well_lit', 'police_presence'].includes(report.report_type)) {
      score = 5 - report.severity;
    } else {
      score = report.severity;
    }

    totalScore += score * weight;
    totalWeight += weight;
  }

  const avgScore = totalScore / totalWeight;

  return 5 - Math.max(1, Math.min(5, avgScore));
}
