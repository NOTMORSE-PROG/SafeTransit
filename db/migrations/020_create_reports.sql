-- Migration 020: Create Reports System
-- Creates universal reports table for all content types

-- Create content type enum
CREATE TYPE report_content_type AS ENUM ('forum_post', 'forum_comment', 'map_tip');

-- Create report reason enum
CREATE TYPE report_reason AS ENUM ('spam', 'false_info', 'harassment', 'inappropriate', 'outdated');

-- Create reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type report_content_type NOT NULL,
  content_id UUID NOT NULL,
  reason report_reason NOT NULL,
  additional_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  -- Unique constraint to prevent duplicate reports from same user
  UNIQUE (reporter_id, content_type, content_id)
);

-- Create indexes for reports table
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_content ON reports(content_type, content_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- Create function to update report count on forum_posts
CREATE OR REPLACE FUNCTION update_forum_post_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.content_type = 'forum_post' THEN
    UPDATE forum_posts 
    SET report_count = report_count + 1,
        status = CASE WHEN report_count + 1 >= 5 THEN 'flagged' ELSE status END
    WHERE id = NEW.content_id;
  ELSIF TG_OP = 'DELETE' AND OLD.content_type = 'forum_post' THEN
    UPDATE forum_posts SET report_count = report_count - 1 WHERE id = OLD.content_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for report count
CREATE TRIGGER update_report_count
AFTER INSERT OR DELETE ON reports
FOR EACH ROW
EXECUTE FUNCTION update_forum_post_report_count();

-- Add comments for documentation
COMMENT ON TABLE reports IS 'User reports for all content types (forum posts, comments, map tips)';
COMMENT ON COLUMN reports.content_id IS 'UUID of the reported content (post_id, comment_id, or tip_id)';
COMMENT ON COLUMN reports.additional_info IS 'Optional additional context from reporter';
