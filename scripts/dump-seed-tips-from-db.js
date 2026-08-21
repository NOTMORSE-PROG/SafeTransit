/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
// Dumps the current SafeTransit-Official-attributed tips back into
// db/seed/seed_tips_v2.json. Useful after migration 036 has been applied —
// the database is now the source of truth, and the original source seed files
// (manila_tips.sql etc.) have been deleted.
//
// Re-run anytime you want to keep the local JSON in sync with prod, or after
// editing tips manually in the database.
//
// Usage:  node scripts/dump-seed-tips-from-db.js

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
const STABLE_CREATED_AT = '2026-01-26T00:00:00+00:00';
const OUT_PATH = path.join(__dirname, '..', 'db', 'seed', 'seed_tips_v2.json');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  const rows = await sql`
    SELECT id, author_id, title, message, category,
           latitude::float8 AS latitude, longitude::float8 AS longitude,
           location_name, time_relevance, status, photo_url, severity,
           verified, verification_source, is_temporary, expires_at
    FROM tips
    WHERE author_id = ${SYSTEM_USER_ID}
    ORDER BY id
  `;

  const records = rows.map((r) => ({
    id: r.id,
    author_id: r.author_id,
    title: r.title,
    message: r.message,
    category: r.category,
    latitude: r.latitude,
    longitude: r.longitude,
    location_name: r.location_name,
    time_relevance: r.time_relevance,
    status: r.status,
    photo_url: r.photo_url,
    severity: r.severity,
    verified: r.verified,
    verification_source: r.verification_source,
    is_temporary: r.is_temporary,
    expires_at: r.expires_at,
    created_at: STABLE_CREATED_AT,
  }));

  fs.writeFileSync(OUT_PATH, JSON.stringify(records, null, 2) + '\n');
  console.log(`✅ Dumped ${records.length} tips → ${OUT_PATH}`);
}

main().catch((err) => {
  console.error('❌ Dump failed:', err);
  process.exit(1);
});
