-- Create user_location_history table for pattern tracking
-- Tracks user search patterns for personalized suggestions (Grab-like)
-- Reference: Grab uses dual embedding (long-term habits + short-term mission)

CREATE TABLE user_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Location reference (optional if it's a known location)
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

  -- Action tracking
  action_type VARCHAR(20) NOT NULL, -- 'search', 'select', 'favorite', 'navigate'

  -- Location data
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geohash VARCHAR(12) NOT NULL,

  -- Location metadata
  location_name TEXT,
  location_address TEXT,

  -- Temporal patterns (for time-based suggestions)
  hour_of_day SMALLINT, -- 0-23
  day_of_week SMALLINT, -- 0-6 (0=Sunday)

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient pattern queries
CREATE INDEX idx_user_location_history_user_time
  ON user_location_history(user_id, created_at DESC);

CREATE INDEX idx_user_location_history_geohash
  ON user_location_history(geohash);

CREATE INDEX idx_user_location_history_hour
  ON user_location_history(user_id, hour_of_day);

CREATE INDEX idx_user_location_history_action
  ON user_location_history(user_id, action_type);

-- Auto-compute geohash on insert
CREATE OR REPLACE FUNCTION update_history_geohash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geohash := encode_geohash(NEW.latitude, NEW.longitude, 7);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_history_geohash
  BEFORE INSERT OR UPDATE OF latitude, longitude ON user_location_history
  FOR EACH ROW
  EXECUTE FUNCTION update_history_geohash();

-- Materialized view for frequent locations
-- Refreshed periodically for fast lookups
CREATE MATERIALIZED VIEW user_frequent_locations AS
SELECT
  user_id,
  geohash,
  location_id,
  location_name,
  location_address,
  latitude,
  longitude,
  COUNT(*) as visit_count,
  MAX(created_at) as last_visit,
  -- Calculate typical hour of day for this location
  MODE() WITHIN GROUP (ORDER BY hour_of_day) as typical_hour,
  -- Calculate typical day of week
  MODE() WITHIN GROUP (ORDER BY day_of_week) as typical_day,
  -- Average coordinates for cluster center
  AVG(latitude) as center_lat,
  AVG(longitude) as center_lon
FROM user_location_history
WHERE action_type IN ('select', 'navigate') -- Only count meaningful actions
GROUP BY user_id, geohash, location_id, location_name, location_address, latitude, longitude
HAVING COUNT(*) >= 3; -- Minimum 3 visits to be considered frequent

-- Indexes on materialized view
CREATE INDEX idx_user_frequent_locations_user
  ON user_frequent_locations(user_id, visit_count DESC);

CREATE INDEX idx_user_frequent_locations_geohash
  ON user_frequent_locations(geohash);

CREATE INDEX idx_user_frequent_locations_hour
  ON user_frequent_locations(user_id, typical_hour);

-- Function to refresh materialized view (call periodically)
CREATE OR REPLACE FUNCTION refresh_frequent_locations()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_frequent_locations;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old history (keep last 90 days)
-- Run periodically via cron job or background task
CREATE OR REPLACE FUNCTION cleanup_old_location_history()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_location_history
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
