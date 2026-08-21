/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
// Pulls Metro Manila police + hospital POIs from the OpenStreetMap Overpass API
// and writes them to constants/safetyPOIs/policeStations.json and hospitals.json.
//
// Free upstream API: https://overpass-api.de  (no key, ODbL license).
// Run manually about once a month to refresh; clients NEVER hit Overpass directly.
//
// Usage:  node scripts/fetch-pois-from-overpass.js

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'constants', 'safetyPOIs');
const ENDPOINT = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'SafeTransit/1.0 (contact: official@safetransit.app)';

// Metro Manila bbox (south, west, north, east)
const BBOX = '14.4,120.8,14.8,121.2';

const QUERIES = {
  police: `[out:json][timeout:60];
(
  node[amenity=police](${BBOX});
  way[amenity=police](${BBOX});
);
out center tags;`,
  hospital: `[out:json][timeout:60];
(
  node[amenity=hospital](${BBOX});
  way[amenity=hospital](${BBOX});
);
out center tags;`,
};

function deterministicId(prefix, osmId) {
  // Build a UUID-shaped string from prefix + osm_id so re-runs produce identical IDs.
  // Format: PPPPPPPP-OOOO-OOOO-OOOO-OOOOOOOOOOOO  where PPPPPPPP is the prefix and
  // O-segments are the zero-padded osm_id split into groups.
  const padded = String(osmId).padStart(20, '0');
  return `${prefix}-${padded.slice(0, 4)}-${padded.slice(4, 8)}-${padded.slice(8, 12)}-${padded.slice(12, 24).padStart(12, '0')}`;
}

async function runQuery(name, query) {
  console.log(`Fetching ${name} from Overpass…`);
  const resp = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'data=' + encodeURIComponent(query),
  });
  if (!resp.ok) throw new Error(`Overpass ${name} failed: ${resp.status} ${resp.statusText}`);
  const data = await resp.json();
  return data.elements || [];
}

function elementToPoi(el, type, idPrefix) {
  const tags = el.tags || {};
  const lat = el.type === 'node' ? el.lat : (el.center && el.center.lat);
  const lon = el.type === 'node' ? el.lon : (el.center && el.center.lon);
  if (!isFinite(lat) || !isFinite(lon)) return null;
  // Drop under-construction / disused / planned entries
  if (tags.construction || tags.disused || tags.proposed || tags.abandoned) return null;
  const name = tags.name || tags['name:en'] || tags['name:tl'];
  if (!name) return null;
  const address = [tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ') || null;
  const phone = tags.phone || tags['contact:phone'] || null;
  return {
    id: deterministicId(idPrefix, el.id),
    osm_id: el.id,
    type,
    subtype: tags.emergency === 'yes' ? 'emergency' : (tags.healthcare || null),
    name,
    address,
    phone,
    latitude: Number(lat.toFixed(7)),
    longitude: Number(lon.toFixed(7)),
    tags: {
      operator: tags.operator || null,
      opening_hours: tags.opening_hours || null,
      website: tags.website || null,
    },
    source: 'osm',
  };
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // Police
  const policeElements = await runQuery('police', QUERIES.police);
  const police = policeElements
    .map((el) => elementToPoi(el, 'police', '70110000'))
    .filter(Boolean);
  fs.writeFileSync(
    path.join(OUT_DIR, 'policeStations.json'),
    JSON.stringify(police, null, 2) + '\n'
  );
  console.log(`✅ ${police.length} police stations → policeStations.json`);

  // Hospitals
  const hospElements = await runQuery('hospital', QUERIES.hospital);
  const hospitals = hospElements
    .map((el) => elementToPoi(el, 'hospital', '80050000'))
    .filter(Boolean);
  fs.writeFileSync(
    path.join(OUT_DIR, 'hospitals.json'),
    JSON.stringify(hospitals, null, 2) + '\n'
  );
  console.log(`✅ ${hospitals.length} hospitals → hospitals.json`);
}

main().catch((err) => {
  console.error('❌ Fetch failed:', err);
  process.exit(1);
});
