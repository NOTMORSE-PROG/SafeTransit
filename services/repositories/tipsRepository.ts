// Tips Repository
// Handles all database operations for community tips and voting

import { neon } from '@neondatabase/serverless';
import type { Tip, TipInsert, TipVote, TipCategory, TipStatus } from '../types/database';

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
// Tips Repository
// ==============================================================================

export const TipsRepository = {
  /**
   * Find tip by ID
   */
  async findById(id: string): Promise<Tip | null> {
    const result = await sql<Tip[]>`
      SELECT * FROM tips WHERE id = ${id} LIMIT 1
    `;
    return result[0] || null;
  },

  /**
   * Find tips by category
   */
  async findByCategory(
    category: TipCategory,
    limit = 50,
    offset = 0
  ): Promise<Tip[]> {
    return await sql<Tip[]>`
      SELECT * FROM tips
      WHERE category = ${category}
        AND status = 'approved'
        AND (is_temporary = FALSE OR expires_at > NOW())
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  },

  /**
   * Find nearby tips (within radius in meters)
   */
  async findNearby(
    latitude: number,
    longitude: number,
    radiusMeters = 5000,
    limit = 50
  ): Promise<Tip[]> {
    // Using Haversine formula for distance calculation
    return await sql<Tip[]>`
      SELECT *,
        (
          6371000 * acos(
            cos(radians(${latitude})) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians(${longitude})) +
            sin(radians(${latitude})) *
            sin(radians(latitude))
          )
        ) AS distance_meters
      FROM tips
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND status = 'approved'
        AND (is_temporary = FALSE OR expires_at > NOW())
      HAVING distance_meters <= ${radiusMeters}
      ORDER BY distance_meters ASC
      LIMIT ${limit}
    `;
  },

  /**
   * Find tips by author
   */
  async findByAuthor(
    authorId: string,
    limit = 50,
    offset = 0
  ): Promise<Tip[]> {
    return await sql<Tip[]>`
      SELECT * FROM tips
      WHERE author_id = ${authorId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  },

  /**
   * Find pending tips (for moderation)
   */
  async findPending(limit = 50, offset = 0): Promise<Tip[]> {
    return await sql<Tip[]>`
      SELECT * FROM tips
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
  },

  /**
   * Create a new tip
   */
  async create(data: TipInsert): Promise<Tip> {
    const result = await sql<Tip[]>`
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
        status
      )
      VALUES (
        ${data.author_id},
        ${data.title},
        ${data.message},
        ${data.category},
        ${data.latitude || null},
        ${data.longitude || null},
        ${data.location_name || null},
        ${data.time_relevance},
        ${data.is_temporary},
        ${data.expires_at || null},
        ${data.status || 'pending'}
      )
      RETURNING *
    `;
    return result[0];
  },

  /**
   * Update tip
   */
  async update(
    id: string,
    data: Partial<Pick<Tip, 'title' | 'message' | 'category' | 'location_name' | 'expires_at'>>
  ): Promise<Tip | null> {
    const updates: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    if (data.message !== undefined) {
      updates.push(`message = $${paramIndex++}`);
      values.push(data.message);
    }
    if (data.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(data.category);
    }
    if (data.location_name !== undefined) {
      updates.push(`location_name = $${paramIndex++}`);
      values.push(data.location_name);
    }
    if (data.expires_at !== undefined) {
      updates.push(`expires_at = $${paramIndex++}`);
      values.push(data.expires_at);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    const result = await sql<Tip[]>`
      UPDATE tips
      SET ${sql.unsafe(updates.join(', '))}
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] || null;
  },

  /**
   * Update tip status
   */
  async updateStatus(id: string, status: TipStatus): Promise<boolean> {
    const result = await sql`
      UPDATE tips
      SET status = ${status}
      WHERE id = ${id}
    `;
    return result.count > 0;
  },

  /**
   * Delete tip
   */
  async delete(id: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM tips WHERE id = ${id}
    `;
    return result.count > 0;
  },

  /**
   * Mark expired tips
   */
  async markExpired(): Promise<number> {
    const result = await sql`
      UPDATE tips
      SET status = 'expired'
      WHERE is_temporary = TRUE
        AND expires_at < NOW()
        AND status != 'expired'
    `;
    return result.count || 0;
  },
};

// ==============================================================================
// Tip Votes Repository
// ==============================================================================

export const TipVotesRepository = {
  /**
   * Add or update a vote
   */
  async vote(
    tipId: string,
    userId: string,
    voteType: 'up' | 'down'
  ): Promise<void> {
    // First, check if user already voted
    const existing = await sql<TipVote[]>`
      SELECT * FROM tip_votes
      WHERE tip_id = ${tipId} AND user_id = ${userId}
      LIMIT 1
    `;

    if (existing.length > 0) {
      const oldVote = existing[0].vote_type;

      if (oldVote === voteType) {
        // Same vote - remove it (toggle off)
        await sql`
          DELETE FROM tip_votes
          WHERE tip_id = ${tipId} AND user_id = ${userId}
        `;

        // Decrement vote count
        if (voteType === 'up') {
          await sql`UPDATE tips SET upvotes = upvotes - 1 WHERE id = ${tipId}`;
        } else {
          await sql`UPDATE tips SET downvotes = downvotes - 1 WHERE id = ${tipId}`;
        }
      } else {
        // Different vote - update it
        await sql`
          UPDATE tip_votes
          SET vote_type = ${voteType}
          WHERE tip_id = ${tipId} AND user_id = ${userId}
        `;

        // Update vote counts (decrease old, increase new)
        if (voteType === 'up') {
          await sql`
            UPDATE tips
            SET upvotes = upvotes + 1, downvotes = downvotes - 1
            WHERE id = ${tipId}
          `;
        } else {
          await sql`
            UPDATE tips
            SET upvotes = upvotes - 1, downvotes = downvotes + 1
            WHERE id = ${tipId}
          `;
        }
      }
    } else {
      // New vote - insert it
      await sql`
        INSERT INTO tip_votes (tip_id, user_id, vote_type)
        VALUES (${tipId}, ${userId}, ${voteType})
      `;

      // Increment vote count
      if (voteType === 'up') {
        await sql`UPDATE tips SET upvotes = upvotes + 1 WHERE id = ${tipId}`;
      } else {
        await sql`UPDATE tips SET downvotes = downvotes + 1 WHERE id = ${tipId}`;
      }
    }
  },

  /**
   * Get user's vote on a tip
   */
  async getUserVote(tipId: string, userId: string): Promise<'up' | 'down' | null> {
    const result = await sql<TipVote[]>`
      SELECT vote_type FROM tip_votes
      WHERE tip_id = ${tipId} AND user_id = ${userId}
      LIMIT 1
    `;
    return result[0]?.vote_type || null;
  },

  /**
   * Get all user votes on multiple tips
   */
  async getUserVotes(
    tipIds: string[],
    userId: string
  ): Promise<Record<string, 'up' | 'down'>> {
    if (tipIds.length === 0) return {};

    const result = await sql<TipVote[]>`
      SELECT tip_id, vote_type FROM tip_votes
      WHERE tip_id = ANY(${tipIds}) AND user_id = ${userId}
    `;

    return result.reduce((acc, vote) => {
      acc[vote.tip_id] = vote.vote_type;
      return acc;
    }, {} as Record<string, 'up' | 'down'>);
  },

  /**
   * Remove vote
   */
  async removeVote(tipId: string, userId: string): Promise<boolean> {
    const existing = await sql<TipVote[]>`
      SELECT vote_type FROM tip_votes
      WHERE tip_id = ${tipId} AND user_id = ${userId}
      LIMIT 1
    `;

    if (existing.length === 0) return false;

    const voteType = existing[0].vote_type;

    await sql`
      DELETE FROM tip_votes
      WHERE tip_id = ${tipId} AND user_id = ${userId}
    `;

    // Decrement vote count
    if (voteType === 'up') {
      await sql`UPDATE tips SET upvotes = upvotes - 1 WHERE id = ${tipId}`;
    } else {
      await sql`UPDATE tips SET downvotes = downvotes - 1 WHERE id = ${tipId}`;
    }

    return true;
  },
};
