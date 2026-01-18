-- Migration 017: Create Pickup Points Table
-- Based on Grab's 120,000+ verified entrance points system
-- Allows multiple pickup/dropoff points per location (gates, entrances, parking areas)

CREATE TABLE IF NOT EXISTS pickup_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_location_id UUID REFERENCES locations(id) ON DELETE CASCADE,

  -- Coordinates of the pickup point
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geohash VARCHAR(12) NOT NULL,

  -- PostGIS geometry for fast spatial queries
  geom GEOMETRY(Point, 4326),

  -- Pickup point details
  type TEXT NOT NULL CHECK (type IN ('entrance', 'gate', 'parking', 'platform', 'terminal', 'main', 'side')),
  name TEXT NOT NULL, -- e.g., "Main Entrance", "Gate 3", "Arrival Bay"
  description TEXT, -- Additional context

  -- Validation metadata
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by TEXT CHECK (verified_by IN ('system', 'user', 'admin')),
  verification_count INTEGER DEFAULT 0 CHECK (verification_count >= 0),

  -- Usage tracking (Grab-style analytics)
  use_count INTEGER DEFAULT 0 CHECK (use_count >= 0),
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- Accessibility
  accessible BOOLEAN DEFAULT TRUE,
  access_notes TEXT, -- e.g., "Wheelchair accessible", "24/7 access", "Covered walkway"

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_pickup_points_parent ON pickup_points(parent_location_id);
CREATE INDEX idx_pickup_points_geohash ON pickup_points(geohash);
CREATE INDEX idx_pickup_points_geom ON pickup_points USING GIST(geom);
CREATE INDEX idx_pickup_points_verified ON pickup_points(verified, use_count DESC);
CREATE INDEX idx_pickup_points_type ON pickup_points(type);

-- Auto-update geohash and geometry on insert/update
CREATE OR REPLACE FUNCTION update_pickup_point_spatial()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geohash := encode_geohash(NEW.latitude, NEW.longitude, 7);
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pickup_point_spatial
  BEFORE INSERT OR UPDATE OF latitude, longitude ON pickup_points
  FOR EACH ROW EXECUTE FUNCTION update_pickup_point_spatial();

-- Comment for documentation
COMMENT ON TABLE pickup_points IS 'Grab-inspired verified pickup/dropoff points for locations. Allows multiple entrance points per POI (gates, entrances, parking areas) for accurate pickup location selection.';
COMMENT ON COLUMN pickup_points.type IS 'Type of pickup point: entrance, gate, parking, platform, terminal, main, side';
COMMENT ON COLUMN pickup_points.verified_by IS 'Who verified this point: system (auto), user (crowdsourced), admin (manually verified)';
COMMENT ON COLUMN pickup_points.use_count IS 'Number of times this pickup point was selected by users (popularity metric)';
