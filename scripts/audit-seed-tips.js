/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
// Read-only audit of which seed-tip IDs are loaded in the database.
// Use BEFORE applying migration 036 to know whether it's UPDATE-only or INSERT-or-UPDATE.
//
// Usage:  node scripts/audit-seed-tips.js

const path = require('path');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  console.log('Auditing tips table…\n');

  const breakdown = await sql`
    SELECT
      CASE
        WHEN id::text LIKE '00000001-%' THEN 'manila_tips.sql (00000001-*)'
        WHEN id::text LIKE '10000001-%' THEN 'manila_city_tips_with_photos.sql (10000001-*)'
        WHEN id::text LIKE '20000001-%' THEN 'port_area / insert-port-tips (20000001-*)'
        ELSE 'real user tip'
      END AS source,
      COUNT(*)::int AS count,
      MIN(created_at) AS oldest,
      MAX(created_at) AS newest
    FROM tips
    GROUP BY 1
    ORDER BY 1
  `;

  console.log('Source breakdown:');
  for (const row of breakdown) {
    console.log(`  ${row.source}: ${row.count}  (oldest: ${row.oldest}, newest: ${row.newest})`);
  }

  console.log('\nSpot-check known-bad records:');
  const samples = await sql`
    SELECT id, title, latitude::float8 AS lat, longitude::float8 AS lng, location_name, author_id
    FROM tips
    WHERE id::text IN (
      '00000001-0000-0000-0000-000000000084',
      '00000001-0000-0000-0000-000000000099',
      '00000001-0000-0000-0000-000000000100',
      '10000001-0000-0000-0000-000000000008',
      '20000001-0000-0000-0000-000000000006'
    )
  `;
  if (samples.length === 0) {
    console.log('  (none of the known-bad seed IDs are in this database)');
  } else {
    for (const s of samples) {
      console.log(`  ${s.id}: "${s.title}" @ (${s.lat}, ${s.lng}) — ${s.location_name}`);
    }
  }

  const totalTips = breakdown.reduce((sum, r) => sum + r.count, 0);
  const seedTips = breakdown.filter((r) => r.source !== 'real user tip').reduce((sum, r) => sum + r.count, 0);
  console.log(`\nTotal tips: ${totalTips}, of which ${seedTips} are from orphan seed files.`);
}

main().catch((err) => {
  console.error('❌ Audit failed:', err);
  process.exit(1);
});
