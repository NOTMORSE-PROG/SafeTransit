/* eslint-disable @typescript-eslint/no-require-imports */
// Database Reset Script
// DANGER: This will drop ALL tables and data
// Only use in development!

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
};

async function reset() {
  console.log(`${colors.yellow}⚠️  WARNING: This will DELETE ALL data in your database!${colors.reset}\n`);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not found in environment');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  try {
    console.log('Dropping all tables...\n');

    // Drop all tables in correct order (respect foreign keys)
    const tablesToDrop = [
      'comment_likes',
      'comments',
      'tip_votes',
      'tips',
      'followed_locations',
      'verification_requests',
      'notification_settings',
      'notifications',
      'family_locations',
      'family_members',
      'families',
      'emergency_contacts',
      'password_reset_tokens',
      'users',
      'schema_migrations',
      // Old tables
      'community_tips',
      'danger_zones',
      'saved_places',
      'recent_locations',
      'route_history',
    ];

    for (const table of tablesToDrop) {
      try {
        await sql`DROP TABLE IF EXISTS ${sql.unsafe(table)} CASCADE`;
        console.log(`  ✓ Dropped ${table}`);
      } catch {
        console.log(`  - ${table} (not found or already dropped)`);
      }
    }

    // Drop enum types
    console.log('\nDropping enum types...\n');
    const enumTypes = [
      'verification_status',
      'tip_category',
      'time_relevance',
      'tip_status',
      'vote_type',
      'family_role',
      'verification_req_status',
    ];

    for (const enumType of enumTypes) {
      try {
        await sql`DROP TYPE IF EXISTS ${sql.unsafe(enumType)} CASCADE`;
        console.log(`  ✓ Dropped ${enumType}`);
      } catch {
        console.log(`  - ${enumType} (not found)`);
      }
    }

    // Drop functions
    console.log('\nDropping functions...\n');
    try {
      await sql`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE`;
      console.log('  ✓ Dropped update_updated_at_column()');
    } catch {
      console.log('  - update_updated_at_column() (not found)');
    }

    console.log(`\n${colors.red}✅ Database reset complete!${colors.reset}`);
    console.log('\nNext step: Run "npm run db:migrate" to set up tables\n');

  } catch (error) {
    console.error('Reset failed:', error);
    process.exit(1);
  }
}

reset();
