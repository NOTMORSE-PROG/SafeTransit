// Database Service
// Using Neon Serverless driver for PostgreSQL connections
// Works via HTTP/WebSocket - compatible with React Native and serverless environments

import { neon, neonConfig } from '@neondatabase/serverless';

// =============================================================================
// Types
// =============================================================================

export interface User {
  id: number;
  device_id: string;
  created_at: string;
  last_active: string;
}

export interface SavedPlace {
  id: number;
  user_id: number;
  type: 'home' | 'work' | 'favorite';
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface DangerZone {
  id: number;
  name: string;
  description: string | null;
  severity: 'low' | 'medium' | 'high';
  latitude: number;
  longitude: number;
  radius_meters: number;
  reported_by: number | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityTip {
  id: number;
  user_id: number | null;
  title: string;
  content: string;
  category: string;
  latitude: number | null;
  longitude: number | null;
  upvotes: number;
  created_at: string;
}

// =============================================================================
// Database Connection
// =============================================================================

const getDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return url;
};

// SQL tagged template - use this for all queries
// Usage: sql`SELECT * FROM users WHERE id = ${userId}`
export const sql = neon(getDatabaseUrl());

// Configure for better performance
neonConfig.fetchConnectionCache = true;

/**
 * Test database connection
 */
export async function testConnection(): Promise<{ success: boolean; message: string; timestamp?: string }> {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    return {
      success: true,
      message: 'Database connection successful',
      timestamp: result[0]?.current_time,
    };
  } catch (error) {
    console.error('Database connection error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

// =============================================================================
// User Repository
// =============================================================================

export const UserRepo = {
  async findById(id: number): Promise<User | null> {
    const result = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
    return (result[0] as User) || null;
  },

  async findByDeviceId(deviceId: string): Promise<User | null> {
    const result = await sql`SELECT * FROM users WHERE device_id = ${deviceId} LIMIT 1`;
    return (result[0] as User) || null;
  },

  async create(deviceId: string): Promise<User> {
    const result = await sql`
      INSERT INTO users (device_id) VALUES (${deviceId}) RETURNING *
    `;
    return result[0] as User;
  },

  async updateLastActive(id: number): Promise<void> {
    await sql`UPDATE users SET last_active = NOW() WHERE id = ${id}`;
  },

  async findOrCreate(deviceId: string): Promise<User> {
    const existing = await this.findByDeviceId(deviceId);
    if (existing) {
      await this.updateLastActive(existing.id);
      return existing;
    }
    return this.create(deviceId);
  },
};

// =============================================================================
// Danger Zone Repository
// =============================================================================

export const DangerZoneRepo = {
  async findAll(limit = 100): Promise<DangerZone[]> {
    const result = await sql`
      SELECT * FROM danger_zones ORDER BY created_at DESC LIMIT ${limit}
    `;
    return result as DangerZone[];
  },

  async findNearby(lat: number, lng: number, radiusKm = 5): Promise<DangerZone[]> {
    const result = await sql`
      SELECT *,
        (6371 * acos(cos(radians(${lat})) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(${lng})) + sin(radians(${lat})) *
        sin(radians(latitude)))) AS distance
      FROM danger_zones
      HAVING distance < ${radiusKm}
      ORDER BY distance
    `;
    return result as DangerZone[];
  },

  async findById(id: number): Promise<DangerZone | null> {
    const result = await sql`SELECT * FROM danger_zones WHERE id = ${id} LIMIT 1`;
    return (result[0] as DangerZone) || null;
  },

  async create(zone: Omit<DangerZone, 'id' | 'created_at' | 'updated_at'>): Promise<DangerZone> {
    const result = await sql`
      INSERT INTO danger_zones (name, description, severity, latitude, longitude, radius_meters, reported_by, verified)
      VALUES (${zone.name}, ${zone.description}, ${zone.severity}, ${zone.latitude}, ${zone.longitude}, ${zone.radius_meters}, ${zone.reported_by}, ${zone.verified})
      RETURNING *
    `;
    return result[0] as DangerZone;
  },

  async delete(id: number): Promise<boolean> {
    const result = await sql`DELETE FROM danger_zones WHERE id = ${id} RETURNING id`;
    return result.length > 0;
  },
};

// =============================================================================
// Community Tips Repository
// =============================================================================

export const CommunityTipRepo = {
  async findAll(limit = 50): Promise<CommunityTip[]> {
    const result = await sql`
      SELECT * FROM community_tips ORDER BY created_at DESC LIMIT ${limit}
    `;
    return result as CommunityTip[];
  },

  async findByCategory(category: string): Promise<CommunityTip[]> {
    const result = await sql`
      SELECT * FROM community_tips WHERE category = ${category} ORDER BY upvotes DESC
    `;
    return result as CommunityTip[];
  },

  async findById(id: number): Promise<CommunityTip | null> {
    const result = await sql`SELECT * FROM community_tips WHERE id = ${id} LIMIT 1`;
    return (result[0] as CommunityTip) || null;
  },

  async create(tip: Omit<CommunityTip, 'id' | 'upvotes' | 'created_at'>): Promise<CommunityTip> {
    const result = await sql`
      INSERT INTO community_tips (user_id, title, content, category, latitude, longitude)
      VALUES (${tip.user_id}, ${tip.title}, ${tip.content}, ${tip.category}, ${tip.latitude}, ${tip.longitude})
      RETURNING *
    `;
    return result[0] as CommunityTip;
  },

  async upvote(id: number): Promise<void> {
    await sql`UPDATE community_tips SET upvotes = upvotes + 1 WHERE id = ${id}`;
  },

  async delete(id: number): Promise<boolean> {
    const result = await sql`DELETE FROM community_tips WHERE id = ${id} RETURNING id`;
    return result.length > 0;
  },
};

// =============================================================================
// Saved Places Repository
// =============================================================================

export const SavedPlaceRepo = {
  async findByUserId(userId: number): Promise<SavedPlace[]> {
    const result = await sql`
      SELECT * FROM saved_places WHERE user_id = ${userId} ORDER BY created_at DESC
    `;
    return result as SavedPlace[];
  },

  async findByType(userId: number, type: 'home' | 'work' | 'favorite'): Promise<SavedPlace | null> {
    const result = await sql`
      SELECT * FROM saved_places WHERE user_id = ${userId} AND type = ${type} LIMIT 1
    `;
    return (result[0] as SavedPlace) || null;
  },

  async create(place: Omit<SavedPlace, 'id' | 'created_at'>): Promise<SavedPlace> {
    const result = await sql`
      INSERT INTO saved_places (user_id, type, name, address, latitude, longitude)
      VALUES (${place.user_id}, ${place.type}, ${place.name}, ${place.address}, ${place.latitude}, ${place.longitude})
      RETURNING *
    `;
    return result[0] as SavedPlace;
  },

  async delete(id: number): Promise<boolean> {
    const result = await sql`DELETE FROM saved_places WHERE id = ${id} RETURNING id`;
    return result.length > 0;
  },
};

/**
 * Initialize database tables (run once)
 */
export async function initDatabase(): Promise<void> {
  try {
    // Create users table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create saved_places table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS saved_places (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('home', 'work', 'favorite')),
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create danger_zones table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS danger_zones (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        radius_meters INTEGER DEFAULT 500,
        reported_by INTEGER REFERENCES users(id),
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create community_tips table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS community_tips (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        upvotes INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
