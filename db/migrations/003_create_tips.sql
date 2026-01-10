-- Migration 003: Create Community Tips System
-- Creates tables for community-sourced safety tips and voting

-- Create enum types for tips
CREATE TYPE tip_category AS ENUM ('lighting', 'safety', 'transit', 'harassment', 'safe_haven');
CREATE TYPE time_relevance AS ENUM ('morning', 'afternoon', 'evening', 'night', '24/7');
CREATE TYPE tip_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE vote_type AS ENUM ('up', 'down');

-- Create tips table
CREATE TABLE tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  category tip_category NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name VARCHAR(255),
  time_relevance time_relevance DEFAULT '24/7' NOT NULL,
  is_temporary BOOLEAN DEFAULT FALSE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  status tip_status DEFAULT 'pending' NOT NULL,
  upvotes INTEGER DEFAULT 0 NOT NULL,
  downvotes INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for tips table
CREATE INDEX idx_tips_author_id ON tips(author_id);
CREATE INDEX idx_tips_category ON tips(category);
CREATE INDEX idx_tips_status ON tips(status);
CREATE INDEX idx_tips_location ON tips(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_tips_created_at ON tips(created_at DESC);
CREATE INDEX idx_tips_expires_at ON tips(expires_at) WHERE is_temporary = TRUE;
CREATE INDEX idx_tips_time_relevance ON tips(time_relevance);

-- Create tip_votes table (tracks individual user votes)
CREATE TABLE tip_votes (
  tip_id UUID NOT NULL REFERENCES tips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type vote_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (tip_id, user_id)
);

-- Create indexes for tip_votes table
CREATE INDEX idx_tip_votes_tip_id ON tip_votes(tip_id);
CREATE INDEX idx_tip_votes_user_id ON tip_votes(user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tips_updated_at
BEFORE UPDATE ON tips
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE tips IS 'Community-sourced safety tips and information';
COMMENT ON TABLE tip_votes IS 'Individual user votes on tips';
COMMENT ON COLUMN tips.time_relevance IS 'When this tip is most relevant (e.g., only at night)';
COMMENT ON COLUMN tips.is_temporary IS 'Whether this tip has an expiration date';
COMMENT ON COLUMN tips.expires_at IS 'When this temporary tip expires';
