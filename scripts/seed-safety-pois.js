/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
// Seeds the safety_pois table from the three constants/safetyPOIs/*.json files.
// Idempotent: ON CONFLICT (id) DO UPDATE.
//
// Usage:  node scripts/seed-safety-pois.js
//
// Run after migration 037 has applied.

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DIR = path.join(__dirname, '..', 'constants', 'safetyPOIs');
const FILES = ['transitStations.json', 'policeStations.json', 'hospitals.json'];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  let totalInserted = 0;
  for (const file of FILES) {
    const fpath = path.join(DIR, file);
    if (!fs.existsSync(fpath)) {
      console.warn(`⚠️  Skipping missing ${file}`);
      continue;
    }
    const records = JSON.parse(fs.readFileSync(fpath, 'utf8'));
    console.log(`Seeding ${records.length} from ${file}…`);

    let count = 0;
    for (const r of records) {
      try {
        await sql`
          INSERT INTO safety_pois (
            id, osm_id, type, subtype, name, address, phone,
            latitude, longitude, tags, source, last_refreshed_at
          )
          VALUES (
            ${r.id},
            ${r.osm_id || null},
            ${r.type},
            ${r.subtype || null},
            ${r.name},
            ${r.address || null},
            ${r.phone || null},
            ${r.latitude},
            ${r.longitude},
            ${r.tags ? JSON.stringify(r.tags) : null},
            ${r.source},
            CURRENT_TIMESTAMP
          )
          ON CONFLICT (id) DO UPDATE SET
            type = EXCLUDED.type,
            subtype = EXCLUDED.subtype,
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            phone = EXCLUDED.phone,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            tags = EXCLUDED.tags,
            source = EXCLUDED.source,
            last_refreshed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        `;
        count++;
      } catch (err) {
        console.error(`  ❌ ${r.id} (${r.name}): ${err.message}`);
      }
    }
    console.log(`  ✅ ${count}/${records.length} seeded from ${file}`);
    totalInserted += count;
  }

  console.log(`\n🎉 Seeded ${totalInserted} POIs total.`);
  const stats = await sql`
    SELECT type, COUNT(*) AS n FROM safety_pois GROUP BY type ORDER BY type
  `;
  for (const row of stats) {
    console.log(`   ${row.type}: ${row.n}`);
  }
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
