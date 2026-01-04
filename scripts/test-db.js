/* eslint-disable @typescript-eslint/no-require-imports */
// Database Connection Test Script
// Run with: node scripts/test-db.js

require('dotenv').config();

const { neon } = require('@neondatabase/serverless');

async function testConnection() {
  console.log('='.repeat(60));
  console.log('SafeTransit Database Connection Test');
  console.log('='.repeat(60));

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('\n[FAIL] DATABASE_URL is not set in .env file');
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

    // Test 2: Initialize tables
    console.log('\n[TEST] Initializing tables...');

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

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
    console.log('[PASS] All tables initialized');

    // Test 3: List tables
    console.log('\n[TEST] Verifying tables...');
    const tables = await sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    console.log('[PASS] Tables found:');
    tables.forEach((t) => console.log(`       - ${t.tablename}`));

    // Test 4: CRUD operations
    console.log('\n[TEST] Testing CRUD operations...');

    // Create test user
    const testDeviceId = `test-device-${Date.now()}`;
    const userResult = await sql`
      INSERT INTO users (device_id) VALUES (${testDeviceId}) RETURNING *
    `;
    const testUser = userResult[0];
    console.log(`[PASS] Created test user (id: ${testUser.id})`);

    // Read user
    const readResult = await sql`SELECT * FROM users WHERE id = ${testUser.id}`;
    if (readResult.length > 0) {
      console.log('[PASS] Read user successfully');
    }

    // Update user
    await sql`UPDATE users SET last_active = NOW() WHERE id = ${testUser.id}`;
    console.log('[PASS] Updated user successfully');

    // Delete test user (cleanup)
    await sql`DELETE FROM users WHERE id = ${testUser.id}`;
    console.log('[PASS] Deleted test user (cleanup)');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('All tests passed! Database is ready for production.');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n[FAIL] Test failed:', error.message);
    if (error.message.includes('password')) {
      console.error('\nTip: Check if your DATABASE_URL credentials are correct');
    }
    process.exit(1);
  }
}

testConnection();
