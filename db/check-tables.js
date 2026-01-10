/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

(async () => {
  const sql = neon(process.env.DATABASE_URL);

  console.log('\nAll tables and types:');
  const all = await sql`
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  all.forEach(t => console.log(`  ${t.table_name} (${t.table_type})`));

  console.log('\nAll enum types:');
  const enums = await sql`
    SELECT typname
    FROM pg_type
    WHERE typtype = 'e'
    ORDER BY typname
  `;
  enums.forEach(e => console.log(`  ${e.typname}`));

  console.log('\nColumn info for users table:');
  const cols = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `;
  cols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (${c.is_nullable})`));
})();
