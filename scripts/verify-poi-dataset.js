/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
// Production smoke check for constants/safetyPOIs/*.json. Exits 1 on any failure.
//
// Asserts:
// 1. transitStations.json has exactly 51 entries (13 MRT-3 + 25 LRT-1 + 13 LRT-2)
// 2. No PNR / Metro Manila Subway / MRT-7 / LRT-1 Phase 2-3 stations leak in
// 3. All coordinates inside Metro Manila bbox
// 4. policeStations.json ≥150, hospitals.json ≥250 (Overpass dump didn't truncate)
// 5. Spot-checks 3 transit stations against this script's hardcoded reference coords
//
// Usage:  node scripts/verify-poi-dataset.js

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'constants', 'safetyPOIs');
const failures = [];
const fail = (msg) => failures.push(msg);

const FORBIDDEN_NAME_REGEX = /\b(PNR|Metro Manila Subway|MRT-7|MRT 7|Las Piñas Station|Zapote Station|Niog Station)\b/i;

// Reference coords from Wikipedia infoboxes (verified 2026-04-26). Used to spot-check.
const REFERENCE = [
  { name: 'MRT-3 Ayala', lat: 14.5489, lng: 121.0277 },
  { name: 'LRT-1 Fernando Poe Jr.', lat: 14.6575, lng: 121.0212 },
  { name: 'LRT-2 Antipolo', lat: 14.6247, lng: 121.1211 },
];

function inBbox(lat, lng) {
  return lat >= 14.4 && lat <= 14.8 && lng >= 120.8 && lng <= 121.2;
}

function readJson(file) {
  const p = path.join(DIR, file);
  if (!fs.existsSync(p)) {
    fail(`missing file: ${p}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
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
  const transit = readJson('transitStations.json');
  const police = readJson('policeStations.json');
  const hospitals = readJson('hospitals.json');

  // Transit count
  if (transit.length !== 51) fail(`transitStations.json: expected 51, got ${transit.length}`);
  const mrt3 = transit.filter((t) => t.subtype === 'MRT-3');
  const lrt1 = transit.filter((t) => t.subtype === 'LRT-1');
  const lrt2 = transit.filter((t) => t.subtype === 'LRT-2');
  if (mrt3.length !== 13) fail(`MRT-3: expected 13, got ${mrt3.length}`);
  if (lrt1.length !== 25) fail(`LRT-1: expected 25, got ${lrt1.length}`);
  if (lrt2.length !== 13) fail(`LRT-2: expected 13, got ${lrt2.length}`);

  // Forbidden names in transit
  for (const t of transit) {
    if (FORBIDDEN_NAME_REGEX.test(t.name)) fail(`forbidden transit name leaked: ${t.name}`);
  }

  // bbox checks for all three datasets
  for (const set of [transit, police, hospitals]) {
    for (const p of set) {
      if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') {
        fail(`${p.id} (${p.name}): non-numeric coords`);
        continue;
      }
      if (!inBbox(p.latitude, p.longitude)) {
        fail(`${p.id} (${p.name}): coords (${p.latitude}, ${p.longitude}) outside Metro Manila`);
      }
    }
  }

  // Min counts (silent-truncation detection)
  if (police.length < 150) fail(`policeStations.json: expected ≥150, got ${police.length}`);
  if (hospitals.length < 250) fail(`hospitals.json: expected ≥250, got ${hospitals.length}`);

  // Spot-check reference stations
  for (const ref of REFERENCE) {
    const match = transit.find((t) => t.name.includes(ref.name));
    if (!match) {
      fail(`reference station not found: ${ref.name}`);
      continue;
    }
    const dist = haversineMeters(match.latitude, match.longitude, ref.lat, ref.lng);
    if (dist > 100) {
      fail(`${match.name}: ${Math.round(dist)}m off Wikipedia coords (${ref.lat}, ${ref.lng})`);
    }
  }

  if (failures.length > 0) {
    console.error('❌ POI dataset verification failed:');
    failures.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  }
  console.log(`✅ Transit: ${transit.length} (${mrt3.length} MRT-3 + ${lrt1.length} LRT-1 + ${lrt2.length} LRT-2)`);
  console.log(`✅ Police:  ${police.length}`);
  console.log(`✅ Hospitals: ${hospitals.length}`);
  console.log('✅ All POI dataset checks passed.');
}

main();
