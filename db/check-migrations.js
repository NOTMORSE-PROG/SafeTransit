/* eslint-disable @typescript-eslint/no-require-imports */
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkMigrations() {
  try {
    const result = await sql`SELECT version, name, executed_at FROM schema_migrations ORDER BY version`;
    console.log('\n📋 Applied migrations:');
    result.forEach(r => {
      console.log(`  ✅ ${r.version}. ${r.name}`);
      console.log(`     Executed: ${new Date(r.executed_at).toLocaleString()}`);
    });
    console.log(`\n✨ Total: ${result.length} migrations applied successfully!\n`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkMigrations();
