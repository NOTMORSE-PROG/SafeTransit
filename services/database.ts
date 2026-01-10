// Database Service
// Using Neon Serverless driver for PostgreSQL connections
// Works via HTTP/WebSocket - compatible with React Native and serverless environments

import { neon, neonConfig } from '@neondatabase/serverless';

// =============================================================================
// Database Connection
// =============================================================================

/**
 * Get database URL from environment variables
 */
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

// =============================================================================
// Database Utilities
// =============================================================================

/**
 * Test database connection
 */
export async function testConnection(): Promise<{
  success: boolean;
  message: string;
  timestamp?: string;
}> {
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
// Re-exports
// =============================================================================

// Export repositories (which already re-export types)
export * from './repositories';

// =============================================================================
// Migration Notice
// =============================================================================

/**
 * IMPORTANT: Database schema is now managed through migrations
 *
 * To set up the database:
 * 1. Ensure DATABASE_URL is set in your .env file
 * 2. Run: npm run db:migrate
 *
 * All table definitions are in db/migrations/
 * All database operations are in services/repositories/
 */
