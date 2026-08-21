/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
// Reads the four orphan seed files and produces a single canonical
// db/seed/seed_tips_v2.json with corrected coords, attribution, and metadata.
//
// Usage:  node scripts/build-corrected-seed.js
//
// Pipeline per record:
//   1. Skip if id ∈ DROP_IDS.
//   2. Apply per-record OVERRIDES (e.g. mojibake fix).
//   3. Look up location_name in VERIFIED_LANDMARKS → use authoritative coords if matched.
//   4. Strip photo_url (set null).
//   5. Force author_id = system user UUID.
//   6. Force verified=true, verification_source='authority'.
//   7. Force created_at = STABLE_CREATED_AT.
//   8. Validate bbox + ASCII/Latin-1; reject otherwise.
//   9. Write to db/seed/seed_tips_v2.json (sorted by id, deduplicated).

const fs = require('fs');
const path = require('path');
const {
  SYSTEM_USER_ID,
  STABLE_CREATED_AT,
  DROP_IDS,
  OVERRIDES,
  findVerifiedLandmark,
  isInMetroManilaBbox,
  hasNonAsciiNonLatin1,
} = require('./build-corrected-seed.helpers');

const SEED_DIR = path.join(__dirname, '..', 'db', 'seed');
const OUTPUT_PATH = path.join(SEED_DIR, 'seed_tips_v2.json');

const SQL_FILES = [
  { path: path.join(SEED_DIR, 'manila_tips.sql'), defaultSeverity: 'low' },
  { path: path.join(SEED_DIR, 'manila_city_tips_with_photos.sql'), defaultSeverity: 'low' },
  { path: path.join(SEED_DIR, 'port_area_manila_tips.sql'), defaultSeverity: 'low' },
];
const JS_FILE = path.join(SEED_DIR, 'insert-port-tips.js');

// Parse a single VALUES (...) tuple. Handles ' as the only quote char and
// 'doubled' single-quote escaping (SQL standard).
function parseSqlValues(tuple) {
  const fields = [];
  let current = '';
  let inString = false;
  for (let i = 0; i < tuple.length; i++) {
    const ch = tuple[i];
    if (ch === "'") {
      if (inString && tuple[i + 1] === "'") {
        current += "'";
        i++;
      } else {
        inString = !inString;
      }
      continue;
    }
    if (!inString && ch === ',') {
      fields.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) fields.push(current.trim());
  return fields;
}

// Strip optional surrounding quotes and the SELECT-id-from-users subquery sentinel.
function stripValue(raw) {
  if (raw === 'NULL' || raw === 'null') return null;
  if (raw.startsWith('(SELECT')) return null;
  if (raw.startsWith("'") && raw.endsWith("'")) return raw.slice(1, -1);
  return raw;
}

function parseSqlFile(filePath, defaultSeverity) {
  const text = fs.readFileSync(filePath, 'utf8');
  // Find each INSERT … VALUES block, then split on `),(` boundaries.
  const records = [];
  const insertRegex = /INSERT\s+INTO\s+tips\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?);/gi;
  let m;
  while ((m = insertRegex.exec(text)) !== null) {
    const cols = m[1].split(',').map((s) => s.trim());
    const valuesBlob = m[2];
    // Split tuples: each top-level (...). Use a tiny state machine.
    const tuples = [];
    let depth = 0;
    let buf = '';
    let inStr = false;
    for (let i = 0; i < valuesBlob.length; i++) {
      const ch = valuesBlob[i];
      if (ch === "'") {
        if (inStr && valuesBlob[i + 1] === "'") {
          buf += "''";
          i++;
          continue;
        }
        inStr = !inStr;
      }
      if (!inStr) {
        if (ch === '(') {
          if (depth === 0) {
            buf = '';
          } else {
            buf += ch;
          }
          depth++;
          continue;
        }
        if (ch === ')') {
          depth--;
          if (depth === 0) {
            tuples.push(buf);
            buf = '';
            continue;
          }
        }
      }
      if (depth > 0) buf += ch;
    }
    for (const tuple of tuples) {
      const vals = parseSqlValues(tuple);
      if (vals.length !== cols.length) continue;
      const rec = {};
      for (let i = 0; i < cols.length; i++) {
        rec[cols[i]] = stripValue(vals[i]);
      }
      rec._severity_default = defaultSeverity;
      records.push(rec);
    }
  }
  return records;
}

function parseJsFile(filePath) {
  // Extract the `portAreaTips` array literal from source text WITHOUT require()-ing
  // the file. Calling require() would execute insertTips() at the bottom and write
  // to the database — see the production-mishap note in the README.
  const src = fs.readFileSync(filePath, 'utf8');
  const start = src.indexOf('const portAreaTips = [');
  if (start === -1) return [];
  const open = src.indexOf('[', start);
  // Find matching closing bracket
  let depth = 0;
  let end = open;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  const arrLiteral = src.slice(open, end + 1);
  // eslint-disable-next-line no-new-func
  const arr = new Function(`return ${arrLiteral};`)();
  // Map the JS shape to the SQL shape we use elsewhere.
  return arr.map((t) => ({
    id: t.id,
    title: t.title,
    message: t.message,
    category: t.category,
    latitude: String(t.lat),
    longitude: String(t.lon),
    location_name: t.location,
    time_relevance: t.time,
    status: 'approved',
    photo_url: t.photo,
    severity: t.severity,
    created_at: STABLE_CREATED_AT,
    _severity_default: 'low',
  }));
}

function correctRecord(rec, log) {
  if (DROP_IDS.has(rec.id)) {
    log.dropped.push({ id: rec.id, reason: 'in DROP_IDS', original: rec.title });
    return null;
  }
  const override = OVERRIDES[rec.id] || {};
  const title = override.title ?? rec.title;
  const message = override.message ?? rec.message;
  const locationName = override.location_name ?? rec.location_name;

  // Lookup verified landmark
  const verified = findVerifiedLandmark(locationName);
  let latitude = parseFloat(rec.latitude);
  let longitude = parseFloat(rec.longitude);
  let correctedFrom = null;
  let updatedLocationName = locationName;

  if (verified) {
    const distMeters = haversineMeters(latitude, longitude, verified.lat, verified.lng);
    if (distMeters > 100) {
      correctedFrom = { lat: latitude, lng: longitude, distMeters: Math.round(distMeters) };
      latitude = verified.lat;
      longitude = verified.lng;
    }
    if (verified.rename) {
      updatedLocationName = `${verified.name}, ${verified.city}`;
    }
  }

  // Validate bbox
  if (!isInMetroManilaBbox(latitude, longitude)) {
    log.rejected.push({ id: rec.id, reason: `coords (${latitude}, ${longitude}) outside Metro Manila bbox`, title });
    return null;
  }

  // Validate text encoding
  if (hasNonAsciiNonLatin1(title) || hasNonAsciiNonLatin1(message) || hasNonAsciiNonLatin1(updatedLocationName)) {
    log.rejected.push({ id: rec.id, reason: 'contains non-Latin-1 characters (mojibake?)', title });
    return null;
  }

  if (correctedFrom) {
    log.corrected.push({ id: rec.id, title, distMeters: correctedFrom.distMeters });
  }

  return {
    id: rec.id,
    author_id: SYSTEM_USER_ID,
    title,
    message,
    category: rec.category,
    latitude,
    longitude,
    location_name: updatedLocationName,
    time_relevance: rec.time_relevance || '24/7',
    status: 'approved',
    photo_url: null,
    severity: rec.severity || rec._severity_default || 'low',
    verified: true,
    verification_source: 'authority',
    is_temporary: false,
    expires_at: null,
    created_at: STABLE_CREATED_AT,
  };
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function main() {
  const log = { kept: 0, dropped: [], corrected: [], rejected: [], duplicates: [] };
  const byId = new Map();

  for (const { path: p, defaultSeverity } of SQL_FILES) {
    if (!fs.existsSync(p)) {
      console.warn(`Skipping missing file: ${p}`);
      continue;
    }
    const records = parseSqlFile(p, defaultSeverity);
    console.log(`Parsed ${records.length} records from ${path.basename(p)}`);
    for (const rec of records) {
      if (byId.has(rec.id)) {
        log.duplicates.push({ id: rec.id, source: path.basename(p) });
        continue;
      }
      byId.set(rec.id, rec);
    }
  }

  if (fs.existsSync(JS_FILE)) {
    const jsRecords = parseJsFile(JS_FILE);
    console.log(`Parsed ${jsRecords.length} records from ${path.basename(JS_FILE)}`);
    for (const rec of jsRecords) {
      if (byId.has(rec.id)) {
        // The JS version of port-area tips has the corrected "Pritil" text — prefer it
        if (rec.title && !rec.title.includes('Притюзвао')) {
          byId.set(rec.id, rec);
        }
        log.duplicates.push({ id: rec.id, source: path.basename(JS_FILE) });
        continue;
      }
      byId.set(rec.id, rec);
    }
  }

  console.log(`\nDeduplicated total: ${byId.size} unique tips`);

  const corrected = [];
  for (const rec of byId.values()) {
    const out = correctRecord(rec, log);
    if (out) corrected.push(out);
  }
  log.kept = corrected.length;

  corrected.sort((a, b) => a.id.localeCompare(b.id));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(corrected, null, 2) + '\n');

  console.log('\n=== SUMMARY ===');
  console.log(`Output:        ${OUTPUT_PATH}`);
  console.log(`Kept:          ${log.kept}`);
  console.log(`Dropped:       ${log.dropped.length}`);
  console.log(`Rejected:      ${log.rejected.length}`);
  console.log(`Coord-fixed:   ${log.corrected.length}`);
  console.log(`Duplicates:    ${log.duplicates.length}`);
  if (log.dropped.length) {
    console.log('\nDROPPED:');
    log.dropped.forEach((d) => console.log(`  ${d.id}: ${d.reason} ("${d.original}")`));
  }
  if (log.rejected.length) {
    console.log('\nREJECTED:');
    log.rejected.forEach((d) => console.log(`  ${d.id}: ${d.reason} ("${d.title}")`));
  }
  if (log.corrected.length) {
    console.log('\nCOORD-FIXED (first 10):');
    log.corrected.slice(0, 10).forEach((d) => console.log(`  ${d.id}: ${d.distMeters}m off — "${d.title}"`));
  }

  if (log.rejected.length > 0) {
    console.error('\n❌ Build failed: some records were rejected. Review and fix overrides.');
    process.exit(1);
  }
  console.log('\n✅ Build succeeded.');
}

main();
