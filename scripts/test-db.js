/* eslint-disable @typescript-eslint/no-require-imports */
// Database Connection Test Script
// Run with: node scripts/test-db.js

require('dotenv').config();

const { neon } = require('@neondatabase/serverless');

async function testConnection() {
  console.log('🔌 Testing Neon PostgreSQL connection...\n');

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in .env file');
    process.exit(1);
  }

  // Mask the password for display
  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`📍 Connecting to: ${maskedUrl}\n`);

  try {
    const sql = neon(databaseUrl);

    // Test basic connection
    console.log('Testing connection...');
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;

    console.log('✅ Connection successful!\n');
    console.log(`⏰ Server time: ${result[0].current_time}`);
    console.log(`🐘 PostgreSQL: ${result[0].pg_version.split(',')[0]}`);

    // Test creating tables
    console.log('\n📦 Initializing database tables...');

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('  ✓ users table ready');

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
    console.log('  ✓ saved_places table ready');

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
    console.log('  ✓ danger_zones table ready');

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
    console.log('  ✓ community_tips table ready');

    // List tables
    console.log('\n📋 Database tables:');
    const tables = await sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    tables.forEach((t) => console.log(`  - ${t.tablename}`));

    console.log('\n🎉 Database setup complete!\n');
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    if (error.message.includes('password')) {
      console.error('\n💡 Tip: Check if your DATABASE_URL credentials are correct');
    }
    process.exit(1);
  }
}

testConnection();
