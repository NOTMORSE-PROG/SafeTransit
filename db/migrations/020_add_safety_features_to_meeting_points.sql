-- Add safety-focused features to pickup_points (rename conceptually to safe meeting points)
-- Keep table name for backwards compatibility, but add safety-specific fields

ALTER TABLE pickup_points
ADD COLUMN IF NOT EXISTS safety_rating DECIMAL(2,1) DEFAULT 3.0,
ADD COLUMN IF NOT EXISTS has_security_guard BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_cctv BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS well_lit_at_night BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS high_foot_traffic BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS staffed_24_7 BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS safety_notes TEXT,
ADD COLUMN IF NOT EXISTS user_safety_reports INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS positive_safety_reports INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_safety_check TIMESTAMP;

-- Update existing pickup points with safety data for major locations
-- SM Mall of Asia - High safety due to 24/7 security
UPDATE pickup_points SET
  safety_rating = 4.5,
  has_security_guard = TRUE,
  has_cctv = TRUE,
  well_lit_at_night = TRUE,
  high_foot_traffic = TRUE,
  staffed_24_7 = TRUE,
  safety_notes = 'Well-secured mall entrance with 24/7 security guards and CCTV coverage'
WHERE name ILIKE '%SM Mall%Asia%' OR description ILIKE '%MOA%';

-- TIP Manila - Moderate safety, has guards during school hours
UPDATE pickup_points SET
  safety_rating = 3.8,
  has_security_guard = TRUE,
  has_cctv = TRUE,
  well_lit_at_night = TRUE,
  high_foot_traffic = TRUE,
  staffed_24_7 = FALSE,
  safety_notes = 'School security guards present during operating hours, well-lit main entrance'
WHERE name ILIKE '%TIP%' OR description ILIKE '%Technological Institute%';

-- NAIA Terminals - Very high safety
UPDATE pickup_points SET
  safety_rating = 5.0,
  has_security_guard = TRUE,
  has_cctv = TRUE,
  well_lit_at_night = TRUE,
  high_foot_traffic = TRUE,
  staffed_24_7 = TRUE,
  safety_notes = 'Airport security with strict monitoring, very safe meeting point'
WHERE name ILIKE '%NAIA%' OR description ILIKE '%Airport%';

-- Train Stations - Good safety during operating hours
UPDATE pickup_points SET
  safety_rating = 4.0,
  has_security_guard = TRUE,
  has_cctv = TRUE,
  well_lit_at_night = TRUE,
  high_foot_traffic = TRUE,
  staffed_24_7 = FALSE,
  safety_notes = 'Transit security present, crowded during rush hours'
WHERE type IN ('platform', 'terminal') OR name ILIKE '%Station%' OR name ILIKE '%MRT%' OR name ILIKE '%LRT%';

-- Hospitals - Very safe, 24/7 staffed
UPDATE pickup_points SET
  safety_rating = 4.8,
  has_security_guard = TRUE,
  has_cctv = TRUE,
  well_lit_at_night = TRUE,
  high_foot_traffic = TRUE,
  staffed_24_7 = TRUE,
  safety_notes = 'Hospital security and staff available 24/7, emergency services nearby'
WHERE description ILIKE '%Hospital%' OR description ILIKE '%Medical%';

-- Add index for safety rating queries
CREATE INDEX IF NOT EXISTS idx_pickup_points_safety_rating ON pickup_points(safety_rating DESC);
CREATE INDEX IF NOT EXISTS idx_pickup_points_safety_features ON pickup_points(has_security_guard, has_cctv, well_lit_at_night);

COMMENT ON COLUMN pickup_points.safety_rating IS 'User-reported safety rating (1.0-5.0 stars)';
COMMENT ON COLUMN pickup_points.has_security_guard IS 'Location has security guard presence';
COMMENT ON COLUMN pickup_points.has_cctv IS 'Location has CCTV surveillance';
COMMENT ON COLUMN pickup_points.well_lit_at_night IS 'Location is well-lit at night';
COMMENT ON COLUMN pickup_points.high_foot_traffic IS 'Location has high pedestrian traffic';
COMMENT ON COLUMN pickup_points.staffed_24_7 IS 'Location has staff present 24/7';
COMMENT ON COLUMN pickup_points.safety_notes IS 'Additional safety information for users';
