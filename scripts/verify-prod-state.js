/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
// Post-deploy verification: queries the production tips + safety_pois tables
// and asserts the cleanup actually landed. Exits 1 on any failure.
//
// Usage:  node scripts/verify-prod-state.js

const path = require('path');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  const failures = [];

  console.log('=== TIPS TABLE ===\n');

  const seedCount = await sql`
    SELECT COUNT(*)::int AS n FROM tips WHERE author_id = ${SYSTEM_USER_ID}
  `;
  console.log(`System-attributed tips: ${seedCount[0].n}`);
  if (seedCount[0].n < 100) failures.push(`expected ≥100 system-attributed tips, got ${seedCount[0].n}`);

  const unsplash = await sql`
    SELECT COUNT(*)::int AS n FROM tips WHERE photo_url LIKE '%unsplash%'
  `;
  console.log(`Tips still using Unsplash photos: ${unsplash[0].n}`);
  if (unsplash[0].n > 0) failures.push(`expected 0 Unsplash photos, got ${unsplash[0].n}`);

  const droppedPandacan = await sql`
    SELECT COUNT(*)::int AS n FROM tips WHERE id::text = '20000001-0000-0000-0000-000000000013'
  `;
  console.log(`Pandacan-LRT tip (should be 0): ${droppedPandacan[0].n}`);
  if (droppedPandacan[0].n > 0) failures.push(`Pandacan tip should have been dropped`);

  const ayalaTips = await sql`
    SELECT id, latitude::float8 AS lat, longitude::float8 AS lng FROM tips
    WHERE id::text = '00000001-0000-0000-0000-000000000002'
  `;
  if (ayalaTips.length > 0) {
    const t = ayalaTips[0];
    console.log(`MRT Ayala tip coords: (${t.lat}, ${t.lng}) — expected ~14.5489, 121.0277`);
    if (Math.abs(t.lat - 14.5489) > 0.001) failures.push(`MRT Ayala lat off`);
    if (Math.abs(t.lng - 121.0277) > 0.001) failures.push(`MRT Ayala lng off`);
  }

  const naiaTips = await sql`
    SELECT id, latitude::float8 AS lat, longitude::float8 AS lng FROM tips
    WHERE id::text = '00000001-0000-0000-0000-000000000099'
  `;
  if (naiaTips.length > 0) {
    const t = naiaTips[0];
    console.log(`NAIA T3 tip coords: (${t.lat}, ${t.lng}) — expected ~14.5201, 121.0142`);
    if (Math.abs(t.lat - 14.5201) > 0.001) failures.push(`NAIA T3 lat off`);
    if (Math.abs(t.lng - 121.0142) > 0.001) failures.push(`NAIA T3 lng off`);
  }

  console.log('\n=== SAFETY_POIS TABLE ===\n');

  const poiCounts = await sql`
    SELECT type, COUNT(*)::int AS n FROM safety_pois GROUP BY type ORDER BY type
  `;
  for (const row of poiCounts) console.log(`  ${row.type}: ${row.n}`);

  const transit = poiCounts.find((r) => r.type === 'transit');
  const police = poiCounts.find((r) => r.type === 'police');
  const hospital = poiCounts.find((r) => r.type === 'hospital');
  if (!transit || transit.n !== 51) failures.push(`transit count expected 51, got ${transit ? transit.n : 0}`);
  if (!police || police.n < 200) failures.push(`police count expected ≥200, got ${police ? police.n : 0}`);
  if (!hospital || hospital.n < 200) failures.push(`hospital count expected ≥200, got ${hospital ? hospital.n : 0}`);

  const pnrLeak = await sql`
    SELECT COUNT(*)::int AS n FROM safety_pois WHERE name ILIKE '%PNR%' OR name ILIKE '%Metro Manila Subway%'
  `;
  console.log(`PNR/MMS leak in safety_pois: ${pnrLeak[0].n}`);
  if (pnrLeak[0].n > 0) failures.push(`forbidden PNR/MMS POIs leaked: ${pnrLeak[0].n}`);

  const sysUser = await sql`
    SELECT id, email, full_name, is_system_user FROM users WHERE id = ${SYSTEM_USER_ID}
  `;
  if (sysUser.length === 0) {
    failures.push(`system user ${SYSTEM_USER_ID} not present`);
  } else {
    console.log(`\nSystem user: ${sysUser[0].email} (${sysUser[0].full_name}), is_system_user=${sysUser[0].is_system_user}`);
    if (!sysUser[0].is_system_user) failures.push(`system user is_system_user flag is false`);
  }

  console.log('\n=== RESULT ===');
  if (failures.length > 0) {
    console.error('❌ FAILED:');
    failures.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  }
  console.log('✅ All production-state checks passed.');
}

main().catch((err) => {
  console.error('❌ verify-prod-state crashed:', err);
  process.exit(1);
});
