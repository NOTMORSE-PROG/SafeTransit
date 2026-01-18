-- Add geohash column to locations table
-- Geohash enables efficient spatial queries like Grab uses
-- Reference: https://www.grab.com/sg/inside-grab/stories/grab-geohashing-location-grid/

-- Add geohash column (precision 7 = ~150m accuracy)
ALTER TABLE locations ADD COLUMN IF NOT EXISTS geohash VARCHAR(12);

-- Create index for geohash prefix queries
-- Enables fast lookups like: WHERE geohash LIKE 'wdw3n%'
CREATE INDEX IF NOT EXISTS idx_locations_geohash ON locations (geohash);

-- Create composite index for search queries with geohash filter
CREATE INDEX IF NOT EXISTS idx_locations_geohash_name ON locations (geohash, name);

-- Create function to encode geohash (pure SQL implementation)
-- This allows computing geohash directly in PostgreSQL
CREATE OR REPLACE FUNCTION encode_geohash(
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  prec INT DEFAULT 7
)
RETURNS VARCHAR AS $$
DECLARE
  chars VARCHAR := '0123456789bcdefghjkmnpqrstuvwxyz';
  bits INT[] := ARRAY[16, 8, 4, 2, 1];
  lat_range DOUBLE PRECISION[] := ARRAY[-90.0, 90.0];
  lon_range DOUBLE PRECISION[] := ARRAY[-180.0, 180.0];
  hash VARCHAR := '';
  ch INT := 0;
  bit INT := 0;
  is_even BOOLEAN := TRUE;
  mid DOUBLE PRECISION;
BEGIN
  WHILE length(hash) < prec LOOP
    IF is_even THEN
      mid := (lon_range[1] + lon_range[2]) / 2;
      IF longitude >= mid THEN
        ch := ch | bits[bit + 1];
        lon_range[1] := mid;
      ELSE
        lon_range[2] := mid;
      END IF;
    ELSE
      mid := (lat_range[1] + lat_range[2]) / 2;
      IF latitude >= mid THEN
        ch := ch | bits[bit + 1];
        lat_range[1] := mid;
      ELSE
        lat_range[2] := mid;
      END IF;
    END IF;

    is_even := NOT is_even;
    bit := bit + 1;

    IF bit = 5 THEN
      hash := hash || substr(chars, ch + 1, 1);
      bit := 0;
      ch := 0;
    END IF;
  END LOOP;

  RETURN hash;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing locations with computed geohash
UPDATE locations
SET geohash = encode_geohash(latitude, longitude, 7)
WHERE geohash IS NULL;

-- Make geohash NOT NULL for future inserts (optional, can keep nullable)
-- ALTER TABLE locations ALTER COLUMN geohash SET NOT NULL;

-- Create trigger to auto-compute geohash on insert/update
CREATE OR REPLACE FUNCTION update_location_geohash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geohash := encode_geohash(NEW.latitude, NEW.longitude, 7);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_location_geohash ON locations;
CREATE TRIGGER trigger_update_location_geohash
  BEFORE INSERT OR UPDATE OF latitude, longitude ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_location_geohash();
