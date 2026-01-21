-- Migration 021: Relax Comment Depth Constraint
-- Increases the maximum allowed nesting depth for comments from 1 to 10

-- Drop the existing constraint
ALTER TABLE forum_comments DROP CONSTRAINT max_comment_depth;

-- Add new constraint with higher limit (10 levels)
ALTER TABLE forum_comments ADD CONSTRAINT max_comment_depth CHECK (depth <= 10);

-- Update comment for documentation
COMMENT ON COLUMN forum_comments.depth IS 'Nesting level: 0 = top-level, max 10 levels';
