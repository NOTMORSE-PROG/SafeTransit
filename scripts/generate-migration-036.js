/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
// Generates db/migrations/036_correct_seed_tips.sql from db/seed/seed_tips_v2.json.
// One INSERT … ON CONFLICT (id) DO UPDATE SET … per record.
// Idempotent: safe to re-run after a db:reset.
//
// Usage:  node scripts/generate-migration-036.js

const fs = require('fs');
const path = require('path');
const { DROP_IDS } = require('./build-corrected-seed.helpers');

const JSON_PATH = path.join(__dirname, '..', 'db', 'seed', 'seed_tips_v2.json');
const OUT_PATH = path.join(__dirname, '..', 'db', 'migrations', '036_correct_seed_tips.sql');

function sqlString(s) {
  if (s === null || s === undefined) return 'NULL';
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function sqlBool(b) {
  return b ? 'TRUE' : 'FALSE';
}

function sqlNum(n) {
  if (n === null || n === undefined) return 'NULL';
  return String(n);
}

function main() {
  const tips = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  const lines = [];
  lines.push('-- Migration 036: Correct seed tips (auto-generated from seed_tips_v2.json).');
  lines.push('-- Source: scripts/generate-migration-036.js');
  lines.push('-- Idempotent: ON CONFLICT (id) DO UPDATE SET … so safe to re-run.');
  lines.push('-- Depends on migration 035 (system user 00000000-…-000).');
  lines.push('');
  if (DROP_IDS.size > 0) {
    lines.push('-- Drop unrecoverable seed tips (e.g. references to non-existent stations)');
    for (const id of DROP_IDS) {
      lines.push(`DELETE FROM tips WHERE id = ${sqlString(id)};`);
    }
    lines.push('');
  }

  for (const t of tips) {
    lines.push(`INSERT INTO tips (id, author_id, title, message, category, latitude, longitude, location_name, time_relevance, status, photo_url, severity, verified, verification_source, is_temporary, expires_at, created_at)`);
    lines.push(`VALUES (`);
    lines.push(`  ${sqlString(t.id)}, ${sqlString(t.author_id)}, ${sqlString(t.title)}, ${sqlString(t.message)},`);
    lines.push(`  ${sqlString(t.category)}, ${sqlNum(t.latitude)}, ${sqlNum(t.longitude)},`);
    lines.push(`  ${sqlString(t.location_name)}, ${sqlString(t.time_relevance)}, ${sqlString(t.status)},`);
    lines.push(`  ${sqlString(t.photo_url)}, ${sqlString(t.severity)}, ${sqlBool(t.verified)}, ${sqlString(t.verification_source)},`);
    lines.push(`  ${sqlBool(t.is_temporary)}, ${sqlString(t.expires_at)}, ${sqlString(t.created_at)}`);
    lines.push(`)`);
    lines.push(`ON CONFLICT (id) DO UPDATE SET`);
    lines.push(`  author_id = EXCLUDED.author_id,`);
    lines.push(`  title = EXCLUDED.title,`);
    lines.push(`  message = EXCLUDED.message,`);
    lines.push(`  category = EXCLUDED.category,`);
    lines.push(`  latitude = EXCLUDED.latitude,`);
    lines.push(`  longitude = EXCLUDED.longitude,`);
    lines.push(`  location_name = EXCLUDED.location_name,`);
    lines.push(`  time_relevance = EXCLUDED.time_relevance,`);
    lines.push(`  status = EXCLUDED.status,`);
    lines.push(`  photo_url = EXCLUDED.photo_url,`);
    lines.push(`  severity = EXCLUDED.severity,`);
    lines.push(`  verified = EXCLUDED.verified,`);
    lines.push(`  verification_source = EXCLUDED.verification_source,`);
    lines.push(`  updated_at = CURRENT_TIMESTAMP;`);
    lines.push('');
  }

  fs.writeFileSync(OUT_PATH, lines.join('\n'));
  console.log(`✅ Wrote ${tips.length} INSERT statements to ${OUT_PATH}`);
}

main();
