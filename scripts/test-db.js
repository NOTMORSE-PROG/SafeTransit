/* eslint-disable @typescript-eslint/no-require-imports */
// Database Connection Test Script
// Run with: npm run db:test

require('dotenv').config();

const { neon } = require('@neondatabase/serverless');

async function testConnection() {
  console.log('='.repeat(60));
  console.log('SafeTransit Database Connection Test');
  console.log('='.repeat(60));

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('\n[FAIL] DATABASE_URL is not set in .env file');
    console.error('\nTo fix:');
    console.error('1. Copy .env.example to .env');
    console.error('2. Add your Neon database URL to .env');
    process.exit(1);
  }

  // Mask the password for display
  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`\nConnecting to: ${maskedUrl}\n`);

  try {
    const sql = neon(databaseUrl);

    // Test 1: Basic connection
    console.log('[TEST] Basic connection...');
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    console.log('[PASS] Connection successful');
    console.log(`       Server time: ${result[0].current_time}`);
    console.log(`       PostgreSQL: ${result[0].pg_version.split(',')[0]}`);

    // Test 2: Check if migrations have been run
    console.log('\n[TEST] Checking database schema...');
    const tables = await sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    if (tables.length === 0) {
      console.log('[WARN] No tables found in database');
      console.log('\nTo set up the database:');
      console.log('1. Run: npm run db:migrate');
      console.log('2. This will create all required tables');
    } else {
      console.log(`[PASS] Found ${tables.length} table(s):`);
      tables.forEach((t) => console.log(`       - ${t.tablename}`));

      // Check for new schema tables
      const tableNames = tables.map(t => t.tablename);
      const expectedTables = [
        'users',
        'password_reset_tokens',
        'emergency_contacts',
        'tips',
        'tip_votes',
        'comments',
        'comment_likes',
        'families',
        'family_members',
        'family_locations',
        'notifications',
        'notification_settings',
        'verification_requests',
        'followed_locations',
        'schema_migrations'
      ];

      const missingTables = expectedTables.filter(t => !tableNames.includes(t));

      if (missingTables.length > 0) {
        console.log('\n[WARN] Some expected tables are missing:');
        missingTables.forEach(t => console.log(`       - ${t}`));
        console.log('\nRun: npm run db:migrate');
      } else {
        console.log('\n[PASS] All expected tables are present');
      }
    }

    // Test 3: Check migration tracking
    const hasMigrations = tables.some(t => t.tablename === 'schema_migrations');
    if (hasMigrations) {
      console.log('\n[TEST] Checking migrations...');
      const migrations = await sql`
        SELECT version, name, executed_at
        FROM schema_migrations
        ORDER BY version
      `;
      console.log(`[PASS] ${migrations.length} migration(s) executed:`);
      migrations.forEach(m => {
        console.log(`       ${String(m.version).padStart(3, '0')} - ${m.name}`);
      });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Database connection test complete!');
    if (tables.length === 0) {
      console.log('\nNext step: Run "npm run db:migrate" to set up tables');
    } else {
      console.log('\nDatabase is ready to use.');
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n[FAIL] Test failed:', error.message);
    if (error.message.includes('password')) {
      console.error('\nTip: Check if your DATABASE_URL credentials are correct');
    }
    if (error.message.includes('does not exist')) {
      console.error('\nTip: The database may not exist. Check your Neon console.');
    }
    process.exit(1);
  }
}

testConnection();
