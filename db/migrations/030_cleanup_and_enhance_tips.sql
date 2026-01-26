-- Migration 030: Cleanup and Enhance Tips System
-- Removes deprecated voting functionality, adds photo support and spatial indexing

-- Drop deprecated tables
DROP TABLE IF EXISTS tip_votes CASCADE;

-- Note: pickup_points table was already removed in previous migrations
-- This is included for safety in case it wasn't fully cleaned up
DROP TABLE IF EXISTS pickup_points CASCADE;

-- Add construction category to tip_category enum (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'construction'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tip_category')
  ) THEN
    ALTER TYPE tip_category ADD VALUE 'construction';
  END IF;
END $$;

-- Remove voting columns from tips table
ALTER TABLE tips
  DROP COLUMN IF EXISTS upvotes,
  DROP COLUMN IF EXISTS downvotes;

-- Add photo support
ALTER TABLE tips
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add PostGIS geography column for efficient spatial queries
-- Note: Requires PostGIS extension (should already be enabled)
ALTER TABLE tips
  ADD COLUMN IF NOT EXISTS geom GEOGRAPHY(Point, 4326);

-- Create or replace function to automatically update geom from lat/lon
CREATE OR REPLACE FUNCTION update_tip_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update geom
DROP TRIGGER IF EXISTS tip_geom_trigger ON tips;
CREATE TRIGGER tip_geom_trigger
  BEFORE INSERT OR UPDATE ON tips
  FOR EACH ROW
  EXECUTE FUNCTION update_tip_geom();

-- Backfill geom for existing tips
UPDATE tips
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND geom IS NULL;

-- Create spatial index for efficient proximity queries
CREATE INDEX IF NOT EXISTS idx_tips_geom ON tips USING GIST(geom);

-- Create composite index for filtered queries (status + category)
CREATE INDEX IF NOT EXISTS idx_tips_status_category ON tips(status, category) WHERE status = 'approved';

-- Create composite index for time-based filtering
CREATE INDEX IF NOT EXISTS idx_tips_time_category ON tips(time_relevance, category) WHERE status = 'approved';

-- Add comments for documentation
COMMENT ON COLUMN tips.photo_url IS 'Optional photo URL from UploadThing service';
COMMENT ON COLUMN tips.geom IS 'PostGIS geography point for efficient spatial queries';
COMMENT ON TRIGGER tip_geom_trigger ON tips IS 'Automatically updates geom column from latitude/longitude';
