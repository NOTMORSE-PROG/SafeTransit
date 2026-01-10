// Family Repository
// Handles all database operations for family groups and location sharing

import { neon } from '@neondatabase/serverless';
import type {
  Family,
  FamilyInsert,
  FamilyMember,
  FamilyLocation,
  FamilyRole,
  QueryResult,
} from '../types/database';

// Get database URL from environment
const getDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return url;
};

const sql = neon(getDatabaseUrl());

// ==============================================================================
// Family Repository
// ==============================================================================

export const FamilyRepository = {
  /**
   * Find family by ID
   */
  async findById(id: string): Promise<Family | null> {
    const result = await sql`
      SELECT * FROM families WHERE id = ${id} LIMIT 1
    `;
    return result[0] as Family || null;
  },

  /**
   * Find family by invite code
   */
  async findByInviteCode(inviteCode: string): Promise<Family | null> {
    const result = await sql`
      SELECT * FROM families WHERE invite_code = ${inviteCode} LIMIT 1
    `;
    return result[0] as Family || null;
  },

  /**
   * Find all families for a user
   */
  async findByUserId(userId: string): Promise<Family[]> {
    return (await sql`
      SELECT f.* FROM families f
      INNER JOIN family_members fm ON f.id = fm.family_id
      WHERE fm.user_id = ${userId}
      ORDER BY f.created_at DESC
    `) as Family[];
  },

  /**
   * Create a new family
   */
  async create(data: FamilyInsert): Promise<Family> {
    const result = await sql`
      INSERT INTO families (name, invite_code, created_by)
      VALUES (${data.name}, ${data.invite_code}, ${data.created_by})
      RETURNING *
    `;
    return result[0] as Family;
  },

  /**
   * Update family name
   */
  async updateName(id: string, name: string): Promise<Family | null> {
    const result = await sql`
      UPDATE families
      SET name = ${name}
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] as Family || null;
  },

  /**
   * Regenerate invite code
   */
  async regenerateInviteCode(id: string, newCode: string): Promise<Family | null> {
    const result = await sql`
      UPDATE families
      SET invite_code = ${newCode}
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] as Family || null;
  },

  /**
   * Delete family
   */
  async delete(id: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM families WHERE id = ${id}
    `;
    return (result as unknown as QueryResult).count > 0;
  },

  /**
   * Generate unique invite code
   */
  generateInviteCode(): string {
    // Generate a 6-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },
};

// ==============================================================================
// Family Members Repository
// ==============================================================================

export const FamilyMembersRepository = {
  /**
   * Get all members of a family
   */
  async findByFamilyId(familyId: string): Promise<FamilyMember[]> {
    return (await sql`
      SELECT * FROM family_members
      WHERE family_id = ${familyId}
      ORDER BY joined_at ASC
    `) as FamilyMember[];
  },

  /**
   * Get member details including user info
   */
  async findWithUserInfo(familyId: string) {
    return await sql`
      SELECT
        fm.*,
        u.full_name,
        u.email,
        u.profile_image_url
      FROM family_members fm
      INNER JOIN users u ON fm.user_id = u.id
      WHERE fm.family_id = ${familyId}
      ORDER BY fm.joined_at ASC
    `;
  },

  /**
   * Check if user is a member of family
   */
  async isMember(familyId: string, userId: string): Promise<boolean> {
    const result = await sql`
      SELECT 1 FROM family_members
      WHERE family_id = ${familyId} AND user_id = ${userId}
      LIMIT 1
    `;
    return result.length > 0;
  },

  /**
   * Get user's role in family
   */
  async getUserRole(familyId: string, userId: string): Promise<FamilyRole | null> {
    const result = await sql`
      SELECT role FROM family_members
      WHERE family_id = ${familyId} AND user_id = ${userId}
      LIMIT 1
    `;
    return (result[0] as FamilyMember)?.role || null;
  },

  /**
   * Add member to family
   */
  async addMember(
    familyId: string,
    userId: string,
    role: FamilyRole = 'member'
  ): Promise<FamilyMember> {
    const result = await sql`
      INSERT INTO family_members (family_id, user_id, role)
      VALUES (${familyId}, ${userId}, ${role})
      RETURNING *
    `;
    return result[0] as FamilyMember;
  },

  /**
   * Remove member from family
   */
  async removeMember(familyId: string, userId: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM family_members
      WHERE family_id = ${familyId} AND user_id = ${userId}
    `;
    return (result as unknown as QueryResult).count > 0;
  },

  /**
   * Update member role
   */
  async updateRole(
    familyId: string,
    userId: string,
    role: FamilyRole
  ): Promise<boolean> {
    const result = await sql`
      UPDATE family_members
      SET role = ${role}
      WHERE family_id = ${familyId} AND user_id = ${userId}
    `;
    return (result as unknown as QueryResult).count > 0;
  },

  /**
   * Get member count for a family
   */
  async getMemberCount(familyId: string): Promise<number> {
    const result = await sql`
      SELECT COUNT(*) as count FROM family_members
      WHERE family_id = ${familyId}
    `;
    return parseInt(result[0]?.count || '0', 10);
  },
};

// ==============================================================================
// Family Locations Repository
// ==============================================================================

export const FamilyLocationsRepository = {
  /**
   * Update user's live location
   */
  async updateLocation(
    userId: string,
    latitude: number,
    longitude: number,
    accuracy?: number
  ): Promise<FamilyLocation> {
    // Mark all previous locations for this user as not live
    await sql`
      UPDATE family_locations
      SET is_live = FALSE
      WHERE user_id = ${userId} AND is_live = TRUE
    `;

    // Insert new live location
    const result = await sql`
      INSERT INTO family_locations (user_id, latitude, longitude, accuracy, is_live)
      VALUES (${userId}, ${latitude}, ${longitude}, ${accuracy || null}, TRUE)
      RETURNING *
    `;
    return result[0] as FamilyLocation;
  },

  /**
   * Get latest live location for a user
   */
  async getLatestLocation(userId: string): Promise<FamilyLocation | null> {
    const result = await sql`
      SELECT * FROM family_locations
      WHERE user_id = ${userId} AND is_live = TRUE
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    return (result[0] as FamilyLocation) || null;
  },

  /**
   * Get latest locations for all family members
   */
  async getFamilyLocations(familyId: string): Promise<FamilyLocation[]> {
    return (await sql`
      SELECT DISTINCT ON (fl.user_id) fl.*
      FROM family_locations fl
      INNER JOIN family_members fm ON fl.user_id = fm.user_id
      WHERE fm.family_id = ${familyId} AND fl.is_live = TRUE
      ORDER BY fl.user_id, fl.timestamp DESC
    `) as FamilyLocation[];
  },

  /**
   * Get latest locations with user info
   */
  async getFamilyLocationsWithUserInfo(familyId: string) {
    return await sql`
      SELECT DISTINCT ON (fl.user_id)
        fl.*,
        u.full_name,
        u.profile_image_url
      FROM family_locations fl
      INNER JOIN family_members fm ON fl.user_id = fm.user_id
      INNER JOIN users u ON fl.user_id = u.id
      WHERE fm.family_id = ${familyId} AND fl.is_live = TRUE
      ORDER BY fl.user_id, fl.timestamp DESC
    `;
  },

  /**
   * Get location history for a user
   */
  async getLocationHistory(
    userId: string,
    limit = 100,
    offset = 0
  ): Promise<FamilyLocation[]> {
    return (await sql`
      SELECT * FROM family_locations
      WHERE user_id = ${userId}
      ORDER BY timestamp DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as FamilyLocation[];
  },

  /**
   * Delete old location history (cleanup - keep last 7 days)
   */
  async deleteOldLocations(daysToKeep = 7): Promise<number> {
    const result = await sql`
      DELETE FROM family_locations
      WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
        AND is_live = FALSE
    `;
    return (result as unknown as QueryResult).count || 0;
  },

  /**
   * Delete all locations for a user
   */
  async deleteForUser(userId: string): Promise<number> {
    const result = await sql`
      DELETE FROM family_locations
      WHERE user_id = ${userId}
    `;
    return (result as unknown as QueryResult).count || 0;
  },
};
