// Tips Repository
// Handles all database operations for safety tips with spatial queries

import { neon } from "@neondatabase/serverless";

// Types
export interface Tip {
  id: string;
  author_id: string;
  title: string;
  message: string;
  category: "lighting" | "safety" | "transit" | "harassment" | "safe_haven" | "construction";
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  time_relevance: "morning" | "afternoon" | "evening" | "night" | "24/7";
  is_temporary: boolean;
  expires_at: string | null;
  status: "pending" | "approved" | "rejected" | "expired";
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TipWithAuthor extends Tip {
  author_name: string;
  author_image: string | null;
}

export interface TipInsert {
  author_id: string;
  title: string;
  message: string;
  category: Tip["category"];
  latitude: number;
  longitude: number;
  location_name: string;
  time_relevance?: Tip["time_relevance"];
  is_temporary?: boolean;
  expires_at?: string;
  status?: Tip["status"];
  photo_url?: string;
}

// Get database URL from environment
const getDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return url;
};

const sql = neon(getDatabaseUrl());

// ==============================================================================
// Tips Repository
// ==============================================================================

export const TipsRepository = {
  /**
   * Get tips with optional spatial filtering
   */
  async getTips(params: {
    latitude?: number;
    longitude?: number;
    radius?: number; // meters
    category?: Tip["category"];
    time?: Tip["time_relevance"];
    status?: Tip["status"];
    userId?: string;
    bounds?: { minLat: number; maxLat: number; minLon: number; maxLon: number };
    limit?: number;
  }): Promise<TipWithAuthor[]> {
    const {
      latitude,
      longitude,
      radius,
      category,
      time,
      status = "approved",
      userId,
      bounds,
      limit = 500,
    } = params;

    const conditions: string[] = [`t.status = '${status}'`];

    if (category) {
      conditions.push(`t.category = '${category}'`);
    }

    if (time) {
      conditions.push(`(t.time_relevance = '${time}' OR t.time_relevance = '24/7')`);
    }

    if (userId) {
      conditions.push(`t.author_id = '${userId}'`);
    }

    // Spatial filtering by radius
    if (latitude !== undefined && longitude !== undefined && radius) {
      conditions.push(`
        ST_DWithin(
          t.geom::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radius}
        )
      `);
    }

    // Spatial filtering by bounds
    if (bounds) {
      conditions.push(`
        t.latitude BETWEEN ${bounds.minLat} AND ${bounds.maxLat}
        AND t.longitude BETWEEN ${bounds.minLon} AND ${bounds.maxLon}
      `);
    }

    const whereClause = conditions.join(" AND ");

    const query = `
      SELECT
        t.*,
        u.full_name as author_name,
        u.profile_image_url as author_image
      FROM tips t
      INNER JOIN users u ON t.author_id = u.id
      WHERE ${whereClause}
      ORDER BY
        ${latitude && longitude && radius ?
          `ST_Distance(t.geom::geography, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography)` :
          't.created_at DESC'
        }
      LIMIT ${limit}
    `;

    const result = await sql(query);
    return result as TipWithAuthor[];
  },

  /**
   * Get a single tip by ID
   */
  async getTipById(tipId: string): Promise<TipWithAuthor | null> {
    const result = await sql`
      SELECT
        t.*,
        u.full_name as author_name,
        u.profile_image_url as author_image
      FROM tips t
      INNER JOIN users u ON t.author_id = u.id
      WHERE t.id = ${tipId}
    `;

    return result.length > 0 ? (result[0] as TipWithAuthor) : null;
  },

  /**
   * Create a new tip (auto-approved)
   */
  async createTip(tipData: TipInsert): Promise<Tip> {
    const {
      author_id,
      title,
      message,
      category,
      latitude,
      longitude,
      location_name,
      time_relevance = "24/7",
      is_temporary = false,
      expires_at = null,
      status = "approved", // Auto-approve
      photo_url = null,
    } = tipData;

    const result = await sql`
      INSERT INTO tips (
        author_id,
        title,
        message,
        category,
        latitude,
        longitude,
        location_name,
        time_relevance,
        is_temporary,
        expires_at,
        status,
        photo_url
      ) VALUES (
        ${author_id},
        ${title},
        ${message},
        ${category},
        ${latitude},
        ${longitude},
        ${location_name},
        ${time_relevance},
        ${is_temporary},
        ${expires_at},
        ${status},
        ${photo_url}
      )
      RETURNING *
    `;

    return result[0] as Tip;
  },

  /**
   * Update a tip (only author can update)
   */
  async updateTip(
    tipId: string,
    userId: string,
    updates: Partial<Pick<Tip, "title" | "message" | "category" | "time_relevance" | "photo_url">>
  ): Promise<Tip | null> {
    // First verify ownership
    const existing = await sql`
      SELECT author_id FROM tips WHERE id = ${tipId}
    `;

    if (existing.length === 0 || existing[0].author_id !== userId) {
      return null;
    }

    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      setClauses.push(`title = $${values.length + 1}`);
      values.push(updates.title);
    }
    if (updates.message !== undefined) {
      setClauses.push(`message = $${values.length + 1}`);
      values.push(updates.message);
    }
    if (updates.category !== undefined) {
      setClauses.push(`category = $${values.length + 1}`);
      values.push(updates.category);
    }
    if (updates.time_relevance !== undefined) {
      setClauses.push(`time_relevance = $${values.length + 1}`);
      values.push(updates.time_relevance);
    }
    if (updates.photo_url !== undefined) {
      setClauses.push(`photo_url = $${values.length + 1}`);
      values.push(updates.photo_url);
    }

    if (setClauses.length === 0) {
      return (await sql`SELECT * FROM tips WHERE id = ${tipId}`)[0] as Tip;
    }

    setClauses.push('updated_at = NOW()');

    const query = `
      UPDATE tips
      SET ${setClauses.join(', ')}
      WHERE id = $${values.length + 1}
      RETURNING *
    `;

    values.push(tipId);

    const result = await sql(query, values);
    return result.length > 0 ? (result[0] as Tip) : null;
  },

  /**
   * Delete a tip (only author can delete)
   */
  async deleteTip(tipId: string, userId: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM tips
      WHERE id = ${tipId} AND author_id = ${userId}
      RETURNING id
    `;

    return result.length > 0;
  },

  /**
   * Get user's tips
   */
  async getUserTips(userId: string): Promise<Tip[]> {
    const result = await sql`
      SELECT * FROM tips
      WHERE author_id = ${userId}
      ORDER BY created_at DESC
    `;

    return result as Tip[];
  },

  /**
   * Get tips in a specific area for heatmap generation
   */
  async getTipsForHeatmap(bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  }): Promise<Tip[]> {
    const result = await sql`
      SELECT * FROM tips
      WHERE status = 'approved'
        AND latitude BETWEEN ${bounds.minLat} AND ${bounds.maxLat}
        AND longitude BETWEEN ${bounds.minLon} AND ${bounds.maxLon}
    `;

    return result as Tip[];
  },
};
