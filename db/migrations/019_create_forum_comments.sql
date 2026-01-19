-- Migration 019: Create Forum Comments System
-- Creates tables for comments on forum posts with threaded replies

-- Create forum_comments table
CREATE TABLE forum_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  content VARCHAR(300) NOT NULL,
  likes INTEGER DEFAULT 0 NOT NULL,
  depth INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  -- Constraint to enforce max 2 levels deep (0 = top-level, 1 = reply)
  CONSTRAINT max_comment_depth CHECK (depth <= 1)
);

-- Create indexes for forum_comments table
CREATE INDEX idx_forum_comments_post_id ON forum_comments(post_id);
CREATE INDEX idx_forum_comments_author_id ON forum_comments(author_id);
CREATE INDEX idx_forum_comments_parent_id ON forum_comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_forum_comments_created_at ON forum_comments(created_at DESC);
CREATE INDEX idx_forum_comments_post_popular ON forum_comments(post_id, likes DESC, created_at DESC);

-- Create forum_comment_likes table (tracks individual user likes)
CREATE TABLE forum_comment_likes (
  comment_id UUID NOT NULL REFERENCES forum_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (comment_id, user_id)
);

-- Create indexes for forum_comment_likes table
CREATE INDEX idx_forum_comment_likes_comment_id ON forum_comment_likes(comment_id);
CREATE INDEX idx_forum_comment_likes_user_id ON forum_comment_likes(user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_forum_comments_updated_at
BEFORE UPDATE ON forum_comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to update comment count on forum_posts
CREATE OR REPLACE FUNCTION update_forum_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment count
CREATE TRIGGER update_comment_count
AFTER INSERT OR DELETE ON forum_comments
FOR EACH ROW
EXECUTE FUNCTION update_forum_post_comment_count();

-- Add comments for documentation
COMMENT ON TABLE forum_comments IS 'User comments on forum posts with threaded replies (max 2 levels)';
COMMENT ON TABLE forum_comment_likes IS 'Individual user likes on comments';
COMMENT ON COLUMN forum_comments.parent_id IS 'Reference to parent comment for replies (null for top-level)';
COMMENT ON COLUMN forum_comments.depth IS 'Nesting level: 0 = top-level, 1 = reply (max)';
