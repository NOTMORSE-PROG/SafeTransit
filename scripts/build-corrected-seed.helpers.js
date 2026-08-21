/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
// Verified landmark coordinates for Metro Manila.
// Each entry was checked against an authoritative source (Wikipedia infobox or
// Nominatim) on 2026-04-26 during the production audit. The build-corrected-seed
// script consumes this map to fix bad coords / wrong city / renamed-station bugs
// in the orphan seed tip files.

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
const STABLE_CREATED_AT = '2026-01-26T00:00:00+00:00';

// Keys are lowercased substrings to match against tip.location_name.
// First match (in order) wins, so list more-specific keys before generic ones.
const VERIFIED_LANDMARKS = [
  // Rail stations - MRT-3 (verified Wikipedia infoboxes)
  { match: 'mrt north avenue', name: 'MRT-3 North Avenue Station', lat: 14.6524, lng: 121.0322, city: 'Quezon City' },
  { match: 'mrt quezon avenue', name: 'MRT-3 Quezon Avenue Station', lat: 14.6424, lng: 121.0387, city: 'Quezon City' },
  { match: 'gma-kamuning', name: 'MRT-3 GMA-Kamuning Station', lat: 14.6351, lng: 121.0434, city: 'Quezon City' },
  { match: 'mrt cubao', name: 'MRT-3 Araneta Center-Cubao Station', lat: 14.6194, lng: 121.0510, city: 'Quezon City' },
  { match: 'mrt santolan', name: 'MRT-3 Santolan-Annapolis Station', lat: 14.6077, lng: 121.0564, city: 'San Juan' },
  { match: 'mrt ortigas', name: 'MRT-3 Ortigas Station', lat: 14.5876, lng: 121.0566, city: 'Mandaluyong' },
  { match: 'mrt shaw', name: 'MRT-3 Shaw Boulevard Station', lat: 14.5814, lng: 121.0537, city: 'Mandaluyong' },
  { match: 'mrt boni', name: 'MRT-3 Boni Station', lat: 14.5738, lng: 121.0482, city: 'Mandaluyong' },
  { match: 'mrt guadalupe', name: 'MRT-3 Guadalupe Station', lat: 14.5669, lng: 121.0455, city: 'Makati' },
  { match: 'mrt buendia', name: 'MRT-3 Buendia Station', lat: 14.5542, lng: 121.0341, city: 'Makati' },
  { match: 'mrt ayala', name: 'MRT-3 Ayala Station', lat: 14.5489, lng: 121.0277, city: 'Makati' },
  { match: 'mrt magallanes', name: 'MRT-3 Magallanes Station', lat: 14.5418, lng: 121.0192, city: 'Makati' },
  { match: 'mrt taft', name: 'MRT-3 Taft Avenue Station', lat: 14.5375, lng: 121.0014, city: 'Pasay' },
  { match: 'mrt north avenue terminal', name: 'MRT-3 North Avenue Station', lat: 14.6524, lng: 121.0322, city: 'Quezon City' },

  // LRT-1 (verified Wikipedia infoboxes). Renamed: Roosevelt -> Fernando Poe Jr.
  { match: 'roosevelt', name: 'LRT-1 Fernando Poe Jr. Station', lat: 14.6575, lng: 121.0212, city: 'Quezon City', rename: true },
  { match: 'fernando poe', name: 'LRT-1 Fernando Poe Jr. Station', lat: 14.6575, lng: 121.0212, city: 'Quezon City' },
  { match: 'balintawak', name: 'LRT-1 Balintawak Station', lat: 14.6573, lng: 121.0040, city: 'Caloocan' },
  { match: 'monumento', name: 'LRT-1 Monumento Station', lat: 14.6541, lng: 120.9839, city: 'Caloocan' },
  { match: 'lrt 5th avenue', name: 'LRT-1 5th Avenue Station', lat: 14.6445, lng: 120.9836, city: 'Caloocan' },
  { match: 'r. papa', name: 'LRT-1 R. Papa Station', lat: 14.6361, lng: 120.9823, city: 'Manila' },
  { match: 'abad santos', name: 'LRT-1 Abad Santos Station', lat: 14.6306, lng: 120.9814, city: 'Manila' },
  { match: 'lrt blumentritt', name: 'LRT-1 Blumentritt Station', lat: 14.6227, lng: 120.9829, city: 'Manila' },
  { match: 'tayuman', name: 'LRT-1 Tayuman Station', lat: 14.6168, lng: 120.9828, city: 'Manila' },
  { match: 'bambang', name: 'LRT-1 Bambang Station', lat: 14.6111, lng: 120.9825, city: 'Manila' },
  { match: 'doroteo jose', name: 'LRT-1 Doroteo Jose Station', lat: 14.6055, lng: 120.9821, city: 'Manila' },
  { match: 'carriedo', name: 'LRT-1 Carriedo Station', lat: 14.5990, lng: 120.9814, city: 'Manila' },
  { match: 'central terminal', name: 'LRT-1 Central Terminal Station', lat: 14.5929, lng: 120.9816, city: 'Manila' },
  { match: 'united nations', name: 'LRT-1 United Nations Station', lat: 14.5825, lng: 120.9847, city: 'Manila' },
  { match: 'pedro gil', name: 'LRT-1 Pedro Gil Station', lat: 14.5766, lng: 120.9880, city: 'Manila' },
  { match: 'lrt quirino', name: 'LRT-1 Quirino Station', lat: 14.5702, lng: 120.9917, city: 'Manila' },
  { match: 'lrt vito cruz', name: 'LRT-1 Vito Cruz Station', lat: 14.5635, lng: 120.9947, city: 'Manila' },
  { match: 'gil puyat', name: 'LRT-1 Gil Puyat Station', lat: 14.5541, lng: 120.9972, city: 'Pasay' },
  { match: 'libertad', name: 'LRT-1 Libertad Station', lat: 14.5478, lng: 120.9986, city: 'Pasay' },
  { match: 'lrt edsa', name: 'LRT-1 EDSA Station', lat: 14.5388, lng: 121.0007, city: 'Pasay' },
  { match: 'baclaran lrt', name: 'LRT-1 Baclaran Station', lat: 14.5346, lng: 121.0001, city: 'Pasay' },

  // LRT-2 (verified Wikipedia infoboxes)
  { match: 'lrt recto', name: 'LRT-2 Recto Station', lat: 14.6035, lng: 120.9834, city: 'Manila' },
  { match: 'legarda', name: 'LRT-2 Legarda Station', lat: 14.6009, lng: 120.9927, city: 'Manila' },
  { match: 'pureza', name: 'LRT-2 Pureza Station', lat: 14.6017, lng: 121.0052, city: 'Manila' },
  { match: 'v. mapa', name: 'LRT-2 V. Mapa Station', lat: 14.6039, lng: 121.0169, city: 'Manila' },
  { match: 'j. ruiz', name: 'LRT-2 J. Ruiz Station', lat: 14.6106, lng: 121.0261, city: 'San Juan' },
  { match: 'gilmore', name: 'LRT-2 Gilmore Station', lat: 14.6133, lng: 121.0339, city: 'Quezon City' },
  { match: 'betty go', name: 'LRT-2 Betty Go-Belmonte Station', lat: 14.6183, lng: 121.0425, city: 'Quezon City' },
  { match: 'lrt cubao', name: 'LRT-2 Araneta Center-Cubao Station', lat: 14.6227, lng: 121.0526, city: 'Quezon City' },
  { match: 'anonas', name: 'LRT-2 Anonas Station', lat: 14.6280, lng: 121.0647, city: 'Quezon City' },
  { match: 'lrt katipunan', name: 'LRT-2 Katipunan Station', lat: 14.6311, lng: 121.0730, city: 'Quezon City' },
  { match: 'lrt santolan', name: 'LRT-2 Santolan Station', lat: 14.6221, lng: 121.0859, city: 'Pasig' },
  { match: 'marikina-pasig', name: 'LRT-2 Marikina-Pasig Station', lat: 14.6203, lng: 121.1003, city: 'Marikina' },
  { match: 'antipolo station', name: 'LRT-2 Antipolo Station', lat: 14.6247, lng: 121.1211, city: 'Antipolo' },

  // Major landmarks (verified Nominatim)
  { match: 'glorietta', name: 'Glorietta', lat: 14.5512, lng: 121.0253, city: 'Makati' },
  { match: 'greenbelt', name: 'Greenbelt', lat: 14.5530, lng: 121.0214, city: 'Makati' },
  { match: 'rockwell', name: 'Rockwell Center', lat: 14.5651, lng: 121.0370, city: 'Makati' },
  { match: 'sm megamall', name: 'SM Megamall', lat: 14.5847, lng: 121.0569, city: 'Mandaluyong' },
  { match: 'trinoma', name: 'TriNoma', lat: 14.6526, lng: 121.0332, city: 'Quezon City' },
  { match: 'sm north edsa', name: 'SM North EDSA', lat: 14.6571, lng: 121.0313, city: 'Quezon City' },
  { match: 'quezon memorial', name: 'Quezon Memorial Circle', lat: 14.6514, lng: 121.0493, city: 'Quezon City' },
  { match: 'qc circle', name: 'Quezon Memorial Circle', lat: 14.6514, lng: 121.0493, city: 'Quezon City' },
  { match: 'quiapo church', name: 'Quiapo Church (Minor Basilica of the Black Nazarene)', lat: 14.5989, lng: 120.9838, city: 'Manila' },
  { match: 'intramuros', name: 'Intramuros', lat: 14.5910, lng: 120.9747, city: 'Manila' },
  { match: 'manila city hall', name: 'Manila City Hall', lat: 14.5893, lng: 120.9816, city: 'Manila' },
  { match: 'manila ocean park', name: 'Manila Ocean Park', lat: 14.5800, lng: 120.9726, city: 'Manila' },
  { match: 'tutuban', name: 'Tutuban Center', lat: 14.6085, lng: 120.9727, city: 'Manila' },
  { match: 'marikina riverbanks', name: 'Marikina Riverbanks', lat: 14.6257, lng: 121.0816, city: 'Marikina' },
  { match: 'alabang town center', name: 'Alabang Town Center', lat: 14.4237, lng: 121.0297, city: 'Muntinlupa' },
  { match: 'resorts world', name: 'Newport World Resorts', lat: 14.5187, lng: 121.0190, city: 'Pasay', rename: true },
  { match: 'newport world', name: 'Newport World Resorts', lat: 14.5187, lng: 121.0190, city: 'Pasay' },
  { match: 'newport city', name: 'Newport World Resorts', lat: 14.5187, lng: 121.0190, city: 'Pasay' },
  { match: 'naia terminal 3', name: 'NAIA Terminal 3', lat: 14.5201, lng: 121.0142, city: 'Pasay' },
  { match: 'bgc high street', name: 'Bonifacio High Street, BGC', lat: 14.5515, lng: 121.0484, city: 'Taguig' },
  { match: 'bonifacio high street', name: 'Bonifacio High Street, BGC', lat: 14.5515, lng: 121.0484, city: 'Taguig' },
  { match: 'market market', name: 'Market! Market!, BGC', lat: 14.5491, lng: 121.0540, city: 'Taguig' },
  { match: 'sm aura', name: 'SM Aura Premier, BGC', lat: 14.5453, lng: 121.0521, city: 'Taguig' },
  { match: 'quezon city hall', name: 'Quezon City Hall', lat: 14.6464, lng: 121.0500, city: 'Quezon City' },
  { match: 'sm mall of asia', name: 'SM Mall of Asia', lat: 14.5352, lng: 120.9816, city: 'Pasay' },
  { match: 'moa complex', name: 'SM Mall of Asia Complex', lat: 14.5352, lng: 120.9816, city: 'Pasay' },
  { match: 'greenhills', name: 'Greenhills Shopping Center', lat: 14.6017, lng: 121.0499, city: 'San Juan' },
  { match: 'makati city hall', name: 'Makati City Hall', lat: 14.5705, lng: 121.0272, city: 'Makati' },
  { match: 'paco park', name: 'Paco Park', lat: 14.5808, lng: 120.9912, city: 'Manila' },
  { match: 'rizal park', name: 'Rizal Park (Luneta)', lat: 14.5828, lng: 120.9794, city: 'Manila' },
  { match: 'luneta', name: 'Rizal Park (Luneta)', lat: 14.5828, lng: 120.9794, city: 'Manila' },
];

// IDs of seed tips that should be DROPPED entirely (cannot be saved by correction):
// - PNR Pandacan ("LRT Pandacan" doesn't exist; PNR Pandacan suspended Mar 2024)
const DROP_IDS = new Set([
  '20000001-0000-0000-0000-000000000013', // "LRT Pandacan Station" - station does not exist
]);

// Specific per-record overrides for tips where the auto-match isn't enough
// (e.g. mojibake text in title that needs exact replacement).
const OVERRIDES = {
  '20000001-0000-0000-0000-000000000006': {
    title: 'Pritil Avenue Busy Traffic Safe',
  },
};

function findVerifiedLandmark(locationName) {
  if (!locationName) return null;
  const lower = locationName.toLowerCase();
  for (const entry of VERIFIED_LANDMARKS) {
    if (lower.includes(entry.match)) {
      return entry;
    }
  }
  return null;
}

function isInMetroManilaBbox(lat, lng) {
  return lat >= 14.4 && lat <= 14.8 && lng >= 120.8 && lng <= 121.2;
}

function hasNonAsciiNonLatin1(s) {
  if (!s) return false;
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (code > 0xFF) return true;
  }
  return false;
}

module.exports = {
  SYSTEM_USER_ID,
  STABLE_CREATED_AT,
  VERIFIED_LANDMARKS,
  DROP_IDS,
  OVERRIDES,
  findVerifiedLandmark,
  isInMetroManilaBbox,
  hasNonAsciiNonLatin1,
};
