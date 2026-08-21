# SafeTransit monorepo

This branch keeps the Expo application at the repository root and imports the
API under `backend/`.

The original backend repository remains the authoritative history and rollback
source. This branch imports its latest committed tree as a clean
synchronization snapshot.

- Canonical GitHub URL: https://github.com/NOTMORSE-PROG/SafeTransit
- Backend history and rollback source:
  https://github.com/NOTMORSE-PROG/SafeTransit_Backend
- Existing backend Vercel project: `safetransit_backend`
- Existing backend production alias: https://safetransitbackend.vercel.app

No deployment project, domain, or alias is renamed. During the eventual
cutover, the existing Vercel project must be reconnected to this repository
with `backend/` as its root directory. The mobile application remains at
`/`, so its build workflow and paths do not move.
