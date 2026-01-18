-- Create user_saved_places table for backend sync
-- Enables cloud backup and cross-device sync like Grab (14M users, 45M saved places)
-- Reference: https://engineering.grab.com/save-your-place-with-grab

CREATE TABLE user_saved_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Place identification
  label VARCHAR(50) NOT NULL, -- 'home', 'work', 'gym', 'favorite', etc.
  name TEXT NOT NULL,
  address TEXT NOT NULL,

  -- Location data
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geohash VARCHAR(12) NOT NULL,

  -- Usage tracking (for personalization)
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only one home/work per user (partial unique index allows multiple favorites)
CREATE UNIQUE INDEX idx_user_saved_places_unique_special
  ON user_saved_places(user_id, label)
  WHERE label IN ('home', 'work');

-- Indexes for efficient queries
CREATE INDEX idx_user_saved_places_user_id ON user_saved_places(user_id);
CREATE INDEX idx_user_saved_places_geohash ON user_saved_places(geohash);
CREATE INDEX idx_user_saved_places_last_used ON user_saved_places(user_id, last_used_at DESC);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_saved_places_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_saved_places_updated_at
  BEFORE UPDATE ON user_saved_places
  FOR EACH ROW
  EXECUTE FUNCTION update_user_saved_places_updated_at();

-- Auto-compute geohash on insert/update
CREATE OR REPLACE FUNCTION update_saved_place_geohash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geohash := encode_geohash(NEW.latitude, NEW.longitude, 7);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_saved_place_geohash
  BEFORE INSERT OR UPDATE OF latitude, longitude ON user_saved_places
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_place_geohash();
