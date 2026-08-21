/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
// Production smoke check for db/seed/seed_tips_v2.json.
// Asserts every record meets the post-cleanup invariants. Exits 1 on any failure.
//
// Usage:  node scripts/verify-seed-corrections.js

const fs = require('fs');
const path = require('path');

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
const SEED_PATH = path.join(__dirname, '..', 'db', 'seed', 'seed_tips_v2.json');

const failures = [];

function fail(id, msg) {
  failures.push(`${id}: ${msg}`);
}

function isOnlyAsciiOrLatin1(s) {
  if (!s) return true;
  for (const ch of s) {
    if (ch.charCodeAt(0) > 0xFF) return false;
  }
  return true;
}

async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
  const resp = await fetch(url, { headers: { 'User-Agent': 'SafeTransit/1.0 verify-script' } });
  if (!resp.ok) throw new Error(`Nominatim ${resp.status}`);
  return resp.json();
}

async function main() {
  if (!fs.existsSync(SEED_PATH)) {
    console.error(`❌ Missing ${SEED_PATH}. Run scripts/build-corrected-seed.js first.`);
    process.exit(1);
  }
  const tips = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  console.log(`Verifying ${tips.length} corrected tips…\n`);

  for (const t of tips) {
    if (typeof t.latitude !== 'number' || t.latitude < 14.4 || t.latitude > 14.8)
      fail(t.id, `latitude ${t.latitude} outside Metro Manila`);
    if (typeof t.longitude !== 'number' || t.longitude < 120.8 || t.longitude > 121.2)
      fail(t.id, `longitude ${t.longitude} outside Metro Manila`);
    if (t.verified !== true) fail(t.id, `verified should be true`);
    if (t.photo_url !== null) fail(t.id, `photo_url should be null (was ${t.photo_url})`);
    if (t.author_id !== SYSTEM_USER_ID) fail(t.id, `author_id should be system UUID`);
    if (t.verification_source !== 'authority') fail(t.id, `verification_source should be 'authority'`);
    if (!isOnlyAsciiOrLatin1(t.title)) fail(t.id, `title contains non-Latin-1 chars (mojibake?): "${t.title}"`);
    if (!isOnlyAsciiOrLatin1(t.message)) fail(t.id, `message contains non-Latin-1 chars`);
    if (!isOnlyAsciiOrLatin1(t.location_name)) fail(t.id, `location_name contains non-Latin-1 chars`);
  }

  if (failures.length > 0) {
    console.error('\n❌ Schema/invariant failures:');
    failures.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  }
  console.log('✅ All schema/invariant checks passed.\n');

  // Sanity check: pick 5 random tips, reverse-geocode them, assert at least one
  // lowercase token from location_name appears in the returned display_name.
  const sample = [];
  const ids = new Set();
  while (sample.length < Math.min(5, tips.length)) {
    const idx = Math.floor(Math.random() * tips.length);
    if (ids.has(idx)) continue;
    ids.add(idx);
    sample.push(tips[idx]);
  }

  let geoFailures = 0;
  for (const t of sample) {
    try {
      const result = await reverseGeocode(t.latitude, t.longitude);
      const display = (result.display_name || '').toLowerCase();
      const tokens = t.location_name
        .toLowerCase()
        .split(/[\s,]+/)
        .filter((w) => w.length > 3 && !['city', 'manila', 'avenue', 'station', 'street', 'road'].includes(w));
      const hasMatch = tokens.length === 0 || tokens.some((tok) => display.includes(tok));
      if (!hasMatch) {
        console.warn(`⚠️  ${t.id} "${t.location_name}" → "${result.display_name}" (no token match — possible coord/name mismatch)`);
        geoFailures++;
      } else {
        console.log(`✓ ${t.id} "${t.location_name}" matches "${result.display_name.slice(0, 80)}…"`);
      }
      // Be polite: 1 req/sec Nominatim policy
      await new Promise((r) => setTimeout(r, 1100));
    } catch (err) {
      console.warn(`⚠️  ${t.id} reverse-geocode failed: ${err.message}`);
      geoFailures++;
    }
  }

  // Geo-sanity is a soft heuristic — Nominatim frequently returns a nearby
  // sub-feature (street, building) rather than the exact landmark. Only fail
  // if every sample misses, which would suggest systemic coord corruption.
  if (geoFailures === sample.length && sample.length > 0) {
    console.error(`\n❌ All ${sample.length} geo-sanity checks failed — likely systemic coord corruption.`);
    process.exit(1);
  }
  if (geoFailures > 0) {
    console.warn(`\n⚠️  ${geoFailures}/${sample.length} geo-sanity samples mismatched. Investigate if persistent.`);
  }

  console.log(`\n✅ All ${tips.length} tips verified. ${sample.length} geo-sanity checks (${sample.length - geoFailures} matched).`);
}

main().catch((err) => {
  console.error('❌ Verification script crashed:', err);
  process.exit(1);
});
