-- Migration 033: Enhance tips table with severity, verification, and engagement metadata
-- This migration adds fields to support better UI/UX, priority filtering, and community engagement

-- Add severity/priority field
ALTER TABLE tips ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'medium';

-- Drop constraint if exists and recreate
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tips_severity_check') THEN
    ALTER TABLE tips DROP CONSTRAINT tips_severity_check;
  END IF;
END $$;

ALTER TABLE tips ADD CONSTRAINT tips_severity_check
  CHECK (severity IN ('low', 'medium', 'high', 'critical'));

-- Add verification fields
ALTER TABLE tips ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE tips ADD COLUMN IF NOT EXISTS verification_source VARCHAR(20);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tips_verification_source_check') THEN
    ALTER TABLE tips DROP CONSTRAINT tips_verification_source_check;
  END IF;
END $$;

ALTER TABLE tips ADD CONSTRAINT tips_verification_source_check
  CHECK (verification_source IS NULL OR verification_source IN ('community', 'authority', 'ai'));

-- Add engagement metrics
ALTER TABLE tips ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE tips ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE tips ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;

-- Add status lifecycle fields
ALTER TABLE tips ADD COLUMN IF NOT EXISTS status_lifecycle VARCHAR(20) DEFAULT 'active';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tips_status_lifecycle_check') THEN
    ALTER TABLE tips DROP CONSTRAINT tips_status_lifecycle_check;
  END IF;
END $$;

ALTER TABLE tips ADD CONSTRAINT tips_status_lifecycle_check
  CHECK (status_lifecycle IN ('active', 'resolved', 'outdated'));

ALTER TABLE tips ADD COLUMN IF NOT EXISTS last_confirmed_at TIMESTAMP;
ALTER TABLE tips ADD COLUMN IF NOT EXISTS confirmed_by_count INTEGER DEFAULT 0;

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_tips_severity ON tips(severity);
CREATE INDEX IF NOT EXISTS idx_tips_status_lifecycle ON tips(status_lifecycle);
CREATE INDEX IF NOT EXISTS idx_tips_verified ON tips(verified) WHERE verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_tips_trending ON tips(is_trending) WHERE is_trending = TRUE;
CREATE INDEX IF NOT EXISTS idx_tips_helpful ON tips(helpful_count DESC);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_tips_status_lifecycle_severity ON tips(status_lifecycle, severity);
CREATE INDEX IF NOT EXISTS idx_tips_category_severity ON tips(category, severity);

-- Add comment for documentation
COMMENT ON COLUMN tips.severity IS 'Priority level: low, medium, high, critical';
COMMENT ON COLUMN tips.verified IS 'Whether tip has been verified by trusted source';
COMMENT ON COLUMN tips.verification_source IS 'Source of verification: community, authority, or ai';
COMMENT ON COLUMN tips.helpful_count IS 'Number of users who found this tip helpful';
COMMENT ON COLUMN tips.view_count IS 'Number of times tip has been viewed';
COMMENT ON COLUMN tips.is_trending IS 'Auto-computed: true if tip is receiving high engagement';
COMMENT ON COLUMN tips.status_lifecycle IS 'Current lifecycle status: active, resolved, or outdated';
COMMENT ON COLUMN tips.last_confirmed_at IS 'Timestamp when tip was last confirmed as still valid';
COMMENT ON COLUMN tips.confirmed_by_count IS 'Number of users who confirmed tip is still valid';

-- Update existing tips with default values for new columns
-- Set severity based on category (harassment and construction are higher priority)
UPDATE tips
SET severity = CASE
  WHEN category = 'harassment' THEN 'high'
  WHEN category = 'construction' THEN 'medium'
  WHEN category = 'lighting' THEN 'medium'
  ELSE 'low'
END
WHERE severity = 'medium' AND created_at < NOW();

-- Mark recent tips (last 24h) with high engagement as trending
UPDATE tips
SET is_trending = TRUE
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND (view_count > 50 OR helpful_count > 5);

-- Auto-set confirmed timestamp for recent tips
UPDATE tips
SET last_confirmed_at = created_at,
    confirmed_by_count = 1
WHERE created_at > NOW() - INTERVAL '7 days'
  AND last_confirmed_at IS NULL;
