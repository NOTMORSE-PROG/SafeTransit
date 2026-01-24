// Heatmap Generator Service
// Real-time safety heatmap generation using geohash grid

import { neon } from "@neondatabase/serverless";
import Geohash from "latlon-geohash";

// Get database URL from environment
const getDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return url;
};

const sql = neon(getDatabaseUrl());

// Category severity weights for safety scoring
const CATEGORY_SEVERITY: Record<string, number> = {
  harassment: 10,
  construction: 3,
  lighting: 5,
  transit: 2,
  safe_haven: -5, // Positive factor
};

/**
 * Get all geohashes within a radius of a point
 */
function getGeohashesInRadius(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  precision: number = 8
): string[] {
  const geohashes = new Set<string>();

  // Calculate approximate degree offset for the radius
  const latOffset = (radiusMeters / 111320); // ~111km per degree latitude
  const lonOffset = (radiusMeters / (111320 * Math.cos(latitude * Math.PI / 180)));

  // Generate grid of points within radius
  const steps = Math.ceil(radiusMeters / 20); // ~20m per step

  for (let i = -steps; i <= steps; i++) {
    for (let j = -steps; j <= steps; j++) {
      const lat = latitude + (i * latOffset / steps);
      const lon = longitude + (j * lonOffset / steps);

      // Check if point is within radius
      const distance = haversineDistance(latitude, longitude, lat, lon) * 1000;
      if (distance <= radiusMeters) {
        geohashes.add(Geohash.encode(lat, lon, precision));
      }
    }
  }

  return Array.from(geohashes);
}

/**
 * Haversine distance calculation (km)
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Regenerate heatmap data for a single geohash cell
 */
async function regenerateHeatmapCell(geohash: string): Promise<void> {
  try {
    // Decode geohash to get center coordinates
    const { lat, lon } = Geohash.decode(geohash);

    // Get all approved tips within 100m of this cell center
    const tips = await sql`
      SELECT category, latitude, longitude
      FROM tips
      WHERE status = 'approved'
        AND ST_DWithin(
          geom::geography,
          ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
          100
        )
    `;

    if (tips.length === 0) {
      // No tips nearby, delete the heatmap cell if it exists
      await sql`
        DELETE FROM safety_heatmap_zones
        WHERE geohash = ${geohash}
      `;
      return;
    }

    // Calculate safety score
    let severitySum = 0;
    let harassmentCount = 0;
    let lightingCount = 0;

    tips.forEach((tip: any) => {
      const severity = CATEGORY_SEVERITY[tip.category] || 5;
      severitySum += severity;

      if (tip.category === 'harassment') harassmentCount++;
      if (tip.category === 'lighting') lightingCount++;
    });

    // Safety score: 100 - (severity per tip * number of tips)
    const avgSeverity = severitySum / tips.length;
    const safetyScore = Math.max(0, Math.min(100, 100 - (avgSeverity * 2)));

    // Upsert heatmap zone
    await sql`
      INSERT INTO safety_heatmap_zones (
        geohash,
        center_lat,
        center_lon,
        geom,
        safety_score,
        tip_count,
        severity_sum,
        harassment_count,
        lighting_count,
        last_updated
      ) VALUES (
        ${geohash},
        ${lat},
        ${lon},
        ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
        ${Math.round(safetyScore)},
        ${tips.length},
        ${severitySum},
        ${harassmentCount},
        ${lightingCount},
        NOW()
      )
      ON CONFLICT (geohash) DO UPDATE SET
        safety_score = EXCLUDED.safety_score,
        tip_count = EXCLUDED.tip_count,
        severity_sum = EXCLUDED.severity_sum,
        harassment_count = EXCLUDED.harassment_count,
        lighting_count = EXCLUDED.lighting_count,
        last_updated = NOW()
    `;
  } catch (error) {
    console.error(`Failed to regenerate heatmap cell ${geohash}:`, error);
    throw error;
  }
}

/**
 * Update heatmap zones when a new tip is created
 * Regenerates all affected geohash cells within 200m radius
 */
export async function updateHeatmapForTip(tipId: string): Promise<void> {
  try {
    // Get tip coordinates
    const tipResult = await sql`
      SELECT latitude, longitude
      FROM tips
      WHERE id = ${tipId}
    `;

    if (tipResult.length === 0) {
      throw new Error(`Tip ${tipId} not found`);
    }

    const tip = tipResult[0];

    // Get affected geohash cells (tip location + 200m buffer)
    const affectedCells = getGeohashesInRadius(
      tip.latitude,
      tip.longitude,
      200,
      8 // Precision 8 = ~19m x 19m cells
    );

    // Regenerate each affected cell
    console.log(`Updating ${affectedCells.length} heatmap cells for tip ${tipId}`);

    for (const geohash of affectedCells) {
      await regenerateHeatmapCell(geohash);
    }

    console.log(`Heatmap update complete for tip ${tipId}`);
  } catch (error) {
    console.error('Heatmap update failed:', error);
    // Don't throw - heatmap update shouldn't block tip creation
  }
}

/**
 * Generate complete heatmap for a region (for initial setup or full refresh)
 */
export async function generateHeatmapForRegion(bounds: {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}): Promise<void> {
  try {
    console.log('Generating heatmap for region:', bounds);

    // Get all approved tips in region
    const tips = await sql`
      SELECT id, latitude, longitude, category
      FROM tips
      WHERE status = 'approved'
        AND latitude BETWEEN ${bounds.minLat} AND ${bounds.maxLat}
        AND longitude BETWEEN ${bounds.minLon} AND ${bounds.maxLon}
    `;

    console.log(`Found ${tips.length} tips in region`);

    // Get unique geohashes
    const geohashes = new Set<string>();
    tips.forEach((tip: any) => {
      const geohash = Geohash.encode(tip.latitude, tip.longitude, 8);
      geohashes.add(geohash);

      // Also add neighboring cells
      const neighbors = getGeohashesInRadius(tip.latitude, tip.longitude, 100, 8);
      neighbors.forEach(n => geohashes.add(n));
    });

    console.log(`Regenerating ${geohashes.size} heatmap cells`);

    // Regenerate each unique cell
    let processed = 0;
    for (const geohash of geohashes) {
      await regenerateHeatmapCell(geohash);
      processed++;

      if (processed % 100 === 0) {
        console.log(`Processed ${processed}/${geohashes.size} cells`);
      }
    }

    console.log('Heatmap generation complete');
  } catch (error) {
    console.error('Heatmap generation failed:', error);
    throw error;
  }
}
