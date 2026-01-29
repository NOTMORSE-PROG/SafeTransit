-- Migration 031: Create Followed Locations System
-- Allows users to follow specific areas and receive notifications when new tips are posted nearby

-- Create followed_locations table
CREATE TABLE IF NOT EXISTS followed_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  geom GEOGRAPHY(Point, 4326),
  radius_meters INTEGER DEFAULT 500 NOT NULL CHECK (radius_meters IN (500, 1000, 5000)),
  location_name VARCHAR(255) NOT NULL,
  notifications_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- Prevent duplicate followed locations for same user
  UNIQUE(user_id, latitude, longitude)
);

-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'followed_locations' AND column_name = 'geom') THEN
    ALTER TABLE followed_locations ADD COLUMN geom GEOGRAPHY(Point, 4326);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'followed_locations' AND column_name = 'radius_meters') THEN
    ALTER TABLE followed_locations ADD COLUMN radius_meters INTEGER DEFAULT 500 NOT NULL CHECK (radius_meters IN (500, 1000, 5000));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'followed_locations' AND column_name = 'notifications_enabled') THEN
    ALTER TABLE followed_locations ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE NOT NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_followed_locations_user ON followed_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_followed_locations_geom ON followed_locations USING GIST(geom);

-- Create trigger to auto-update geom from lat/lon (reuse the same function)
DROP TRIGGER IF EXISTS followed_location_geom_trigger ON followed_locations;
CREATE TRIGGER followed_location_geom_trigger
  BEFORE INSERT OR UPDATE ON followed_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_tip_geom();

-- Add comments for documentation
COMMENT ON TABLE followed_locations IS 'User-followed locations for safety tip notifications';
COMMENT ON COLUMN followed_locations.radius_meters IS 'Notification radius: 500m, 1km, or 5km';
COMMENT ON COLUMN followed_locations.notifications_enabled IS 'Whether to send push notifications (infrastructure for future use)';
COMMENT ON COLUMN followed_locations.geom IS 'PostGIS geography point for efficient proximity matching';
