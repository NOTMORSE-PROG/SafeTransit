-- SafeTransit Safety Reporting System
-- User-reported unsafe areas and safety incidents

-- Drop old pickup_points table if it exists
DROP TABLE IF EXISTS pickup_points CASCADE;

-- Create safety reports table
CREATE TABLE IF NOT EXISTS safety_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Location
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geohash VARCHAR(12) NOT NULL,
  geom GEOGRAPHY(Point, 4326),
  location_name TEXT,

  -- Report details
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
    'unsafe_area',
    'theft',
    'harassment',
    'assault',
    'poor_lighting',
    'suspicious_activity',
    'safe_area',
    'well_lit',
    'police_presence'
  )),
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 3), -- 1=low, 2=medium, 3=high
  description TEXT,
  time_of_incident TIMESTAMP WITH TIME ZONE,

  -- Validation
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verification_count INTEGER DEFAULT 0,

  -- Community engagement
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived', 'spam')),
  resolved_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX idx_safety_reports_geohash ON safety_reports(geohash);
CREATE INDEX idx_safety_reports_geom ON safety_reports USING GIST(geom);
CREATE INDEX idx_safety_reports_type ON safety_reports(report_type);
CREATE INDEX idx_safety_reports_severity ON safety_reports(severity DESC);
CREATE INDEX idx_safety_reports_created ON safety_reports(created_at DESC);
CREATE INDEX idx_safety_reports_status ON safety_reports(status) WHERE status = 'active';

-- Trigger to auto-update geom from lat/lon
CREATE OR REPLACE FUNCTION update_safety_report_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER safety_report_geom_trigger
  BEFORE INSERT OR UPDATE ON safety_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_safety_report_geom();

-- Create user safety report votes table
CREATE TABLE IF NOT EXISTS safety_report_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES safety_reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('upvote', 'downvote', 'helpful')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(report_id, user_id, vote_type)
);

CREATE INDEX idx_safety_votes_report ON safety_report_votes(report_id);
CREATE INDEX idx_safety_votes_user ON safety_report_votes(user_id);

COMMENT ON TABLE safety_reports IS 'User-reported safety incidents and unsafe areas';
COMMENT ON COLUMN safety_reports.report_type IS 'Type of safety report (unsafe_area, theft, etc.)';
COMMENT ON COLUMN safety_reports.severity IS 'Severity level: 1=low, 2=medium, 3=high';
COMMENT ON COLUMN safety_reports.verified IS 'Whether report has been verified by multiple users';
