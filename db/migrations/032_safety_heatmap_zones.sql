-- Migration 032: Create Safety Heatmap Zones System
-- Pre-computed heatmap zones for efficient real-time visualization of safety data

-- Create safety_heatmap_zones table
CREATE TABLE safety_heatmap_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  geohash VARCHAR(8) NOT NULL UNIQUE,
  center_lat DECIMAL(10, 8) NOT NULL,
  center_lon DECIMAL(11, 8) NOT NULL,
  geom GEOGRAPHY(Point, 4326),
  safety_score INTEGER NOT NULL CHECK (safety_score BETWEEN 0 AND 100),
  tip_count INTEGER DEFAULT 0 NOT NULL,
  severity_sum INTEGER DEFAULT 0 NOT NULL,
  harassment_count INTEGER DEFAULT 0 NOT NULL,
  lighting_count INTEGER DEFAULT 0 NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX idx_heatmap_geohash ON safety_heatmap_zones(geohash);
CREATE INDEX idx_heatmap_geom ON safety_heatmap_zones USING GIST(geom);
CREATE INDEX idx_heatmap_score ON safety_heatmap_zones(safety_score);

-- Create trigger to auto-update geom from lat/lon
DROP TRIGGER IF EXISTS heatmap_geom_trigger ON safety_heatmap_zones;
CREATE TRIGGER heatmap_geom_trigger
  BEFORE INSERT OR UPDATE ON safety_heatmap_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_tip_geom();

-- Add comments for documentation
COMMENT ON TABLE safety_heatmap_zones IS 'Pre-computed heatmap zones for real-time safety visualization';
COMMENT ON COLUMN safety_heatmap_zones.geohash IS 'Geohash precision 8 (~19m x 19m grid) for spatial indexing';
COMMENT ON COLUMN safety_heatmap_zones.safety_score IS 'Safety score from 0 (danger) to 100 (safe)';
COMMENT ON COLUMN safety_heatmap_zones.tip_count IS 'Number of tips contributing to this zone';
COMMENT ON COLUMN safety_heatmap_zones.severity_sum IS 'Sum of severity weights for all tips in zone';
COMMENT ON COLUMN safety_heatmap_zones.harassment_count IS 'Count of harassment tips (high severity)';
COMMENT ON COLUMN safety_heatmap_zones.lighting_count IS 'Count of lighting tips (common in Manila)';
COMMENT ON COLUMN safety_heatmap_zones.last_updated IS 'Last time this zone was recalculated';
