/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

(async () => {
  const sql = neon(process.env.DATABASE_URL);

  console.log('Testing migration 001...\n');

  const file = fs.readFileSync(path.join(__dirname, 'migrations', '001_create_users.sql'), 'utf8');

  // Remove comments
  let cleaned = file
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  // Split by semicolons
  const statements = cleaned
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Found ${statements.length} statements\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`Statement ${i + 1}:`, stmt.substring(0, 100) + '...\n');

    try {
      await sql.unsafe(stmt);
      console.log(`✓ Success\n`);
    } catch (error) {
      console.error(`✗ FAILED: ${error.message}\n`);
    }
  }

  // Check what was created
  const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  console.log('\nTables in database:');
  tables.forEach(t => console.log(`  - ${t.tablename}`));
})();
