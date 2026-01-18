-- Enable PostGIS for advanced spatial queries
-- PostGIS provides true geospatial database capabilities beyond geohashing
-- Neon PostgreSQL supports PostGIS extension

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry column to locations table
-- SRID 4326 = WGS84 (standard lat/lon coordinate system)
ALTER TABLE locations ADD COLUMN IF NOT EXISTS geom GEOMETRY(Point, 4326);

-- Populate geometry from existing latitude/longitude
UPDATE locations
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE geom IS NULL;

-- Create spatial index for fast geospatial queries
-- GIST (Generalized Search Tree) is optimal for spatial data
CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST(geom);

-- Create trigger to auto-update geometry when lat/lon changes
CREATE OR REPLACE FUNCTION update_location_geometry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_location_geometry ON locations;
CREATE TRIGGER trigger_update_location_geometry
  BEFORE INSERT OR UPDATE OF latitude, longitude ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_location_geometry();

-- Add geometry to user_saved_places
ALTER TABLE user_saved_places ADD COLUMN IF NOT EXISTS geom GEOMETRY(Point, 4326);

UPDATE user_saved_places
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE geom IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_saved_places_geom ON user_saved_places USING GIST(geom);

-- Trigger for user_saved_places
CREATE OR REPLACE FUNCTION update_saved_place_geometry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_saved_place_geometry ON user_saved_places;
CREATE TRIGGER trigger_update_saved_place_geometry
  BEFORE INSERT OR UPDATE OF latitude, longitude ON user_saved_places
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_place_geometry();

-- Add geometry to user_location_history
ALTER TABLE user_location_history ADD COLUMN IF NOT EXISTS geom GEOMETRY(Point, 4326);

UPDATE user_location_history
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE geom IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_location_history_geom ON user_location_history USING GIST(geom);

-- Trigger for user_location_history
CREATE OR REPLACE FUNCTION update_history_geometry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_history_geometry ON user_location_history;
CREATE TRIGGER trigger_update_history_geometry
  BEFORE INSERT OR UPDATE OF latitude, longitude ON user_location_history
  FOR EACH ROW
  EXECUTE FUNCTION update_history_geometry();

-- Example queries for reference (not executed):

-- Find locations within radius (uses geography for accurate distance)
-- SELECT *, ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(120.9842, 14.5995), 4326)::geography) as distance_m
-- FROM locations
-- WHERE ST_DWithin(
--   geom::geography,
--   ST_SetSRID(ST_MakePoint(120.9842, 14.5995), 4326)::geography,
--   5000  -- 5km in meters
-- )
-- ORDER BY distance_m
-- LIMIT 10;

-- Find nearest N locations (K-nearest neighbor)
-- SELECT *, ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(120.9842, 14.5995), 4326)::geography) as distance_m
-- FROM locations
-- ORDER BY geom <-> ST_SetSRID(ST_MakePoint(120.9842, 14.5995), 4326)
-- LIMIT 10;

-- Check if point is within polygon (geofencing)
-- SELECT * FROM locations
-- WHERE ST_Contains(
--   ST_GeomFromText('POLYGON((120.98 14.59, 120.99 14.59, 120.99 14.60, 120.98 14.60, 120.98 14.59))', 4326),
--   geom
-- );
