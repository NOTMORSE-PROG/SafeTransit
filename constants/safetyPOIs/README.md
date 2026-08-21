# Safety POI datasets

Three JSON files that bootstrap the safety pin layer (police, hospitals, transit).
Loaded on app start so the map is non-empty offline; the backend `/api/locations/search?mode=poi`
endpoint serves fresher data when online.

## Files

| File | Source | Refresh process |
|---|---|---|
| `transitStations.json` | **Hand-curated** from Wikipedia infoboxes (verified 2026-04-26) | Manual edits when stations open / are renamed. Do NOT auto-overwrite from OSM — Manila rail tagging in OSM is unreliable (see plan notes). |
| `policeStations.json` | OSM `node[amenity=police]` via `scripts/fetch-pois-from-overpass.js` | Run `npm run pois:fetch` ~once a month. |
| `hospitals.json` | OSM `(node,way)[amenity=hospital]` with `out center` | Same script. |

## Refresh workflow

```bash
# 1. Pull fresh data from Overpass API (free, no key)
npm run pois:fetch

# 2. Re-seed the safety_pois table in Neon
npm run pois:seed

# 3. Sanity check
npm run verify:pins
```

## Excluded by design

- **PNR Metro Manila stations** — operations suspended Mar 2024 for NSCR construction.
  Pinning them would mislead users into thinking trains run.
- **Metro Manila Subway / MRT-7** — under construction. The Overpass dump returns these
  with `construction=*` or future `network=Metro Manila Subway` / `network=Manila MRT`
  tags; the fetch script filters them out.
- **LRT-1 Cavite Extension Phase 2/3** (Las Piñas, Zapote, Niog) — not yet operational.

## Coverage as of 2026-04-26

- 51 transit stations (13 MRT-3 + 25 LRT-1 + 13 LRT-2)
- 364 police stations
- 267 hospitals

## Schema

See [`types/safetyPOI.ts`](../../types/safetyPOI.ts) for the canonical TypeScript shape.
