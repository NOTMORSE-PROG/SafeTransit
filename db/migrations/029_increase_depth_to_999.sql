-- Migration: Increase comment depth limit to 999 (essentially unlimited nesting)
-- This allows Facebook-like comment threading

-- Drop the existing constraint
ALTER TABLE forum_comments DROP CONSTRAINT IF EXISTS forum_comments_depth_check;

-- Add new constraint allowing up to 999 levels of nesting
ALTER TABLE forum_comments ADD CONSTRAINT forum_comments_depth_check CHECK (depth <= 999);
