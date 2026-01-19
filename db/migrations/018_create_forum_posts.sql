-- Migration 018: Create Forum Posts System
-- Creates tables for community forum discussions (separate from Map Tips)

-- Create post flair enum
CREATE TYPE post_flair AS ENUM ('general', 'routes', 'questions', 'experiences', 'tips_advice');

-- Create forum post status enum
CREATE TYPE forum_post_status AS ENUM ('visible', 'hidden', 'flagged');

-- Create forum_posts table
CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  body VARCHAR(2000) NOT NULL,
  flair post_flair NOT NULL DEFAULT 'general',
  location_tag VARCHAR(255),
  photo_url TEXT,
  upvotes INTEGER DEFAULT 0 NOT NULL,
  downvotes INTEGER DEFAULT 0 NOT NULL,
  comment_count INTEGER DEFAULT 0 NOT NULL,
  report_count INTEGER DEFAULT 0 NOT NULL,
  status forum_post_status DEFAULT 'visible' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for forum_posts table
CREATE INDEX idx_forum_posts_author_id ON forum_posts(author_id);
CREATE INDEX idx_forum_posts_flair ON forum_posts(flair);
CREATE INDEX idx_forum_posts_status ON forum_posts(status);
CREATE INDEX idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX idx_forum_posts_popular ON forum_posts((upvotes - downvotes) DESC, created_at DESC);

-- Create forum_post_votes table (tracks individual user votes)
CREATE TABLE forum_post_votes (
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type vote_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

-- Create indexes for forum_post_votes table
CREATE INDEX idx_forum_post_votes_post_id ON forum_post_votes(post_id);
CREATE INDEX idx_forum_post_votes_user_id ON forum_post_votes(user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_forum_posts_updated_at
BEFORE UPDATE ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to auto-hide posts with net votes < -10
CREATE OR REPLACE FUNCTION check_forum_post_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.upvotes - NEW.downvotes) < -10 AND NEW.status = 'visible' THEN
    NEW.status := 'hidden';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-hide
CREATE TRIGGER auto_hide_forum_posts
BEFORE UPDATE ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION check_forum_post_votes();

-- Add comments for documentation
COMMENT ON TABLE forum_posts IS 'Community forum posts for discussions (separate from Map Tips)';
COMMENT ON TABLE forum_post_votes IS 'Individual user votes on forum posts';
COMMENT ON COLUMN forum_posts.flair IS 'Post category/topic classification';
COMMENT ON COLUMN forum_posts.status IS 'Visibility status (hidden if net votes < -10)';
