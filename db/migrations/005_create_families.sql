-- Migration 005: Create Family Features
-- Creates tables for family groups and real-time location sharing

-- Create enum for family member roles
CREATE TYPE family_role AS ENUM ('creator', 'member');

-- Create families table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  invite_code VARCHAR(50) UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for families table
CREATE INDEX idx_families_invite_code ON families(invite_code);
CREATE INDEX idx_families_created_by ON families(created_by);

-- Create family_members table
CREATE TABLE family_members (
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role family_role DEFAULT 'member' NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (family_id, user_id)
);

-- Create indexes for family_members table
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);

-- Create family_locations table for real-time location tracking
CREATE TABLE family_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy REAL,
  is_live BOOLEAN DEFAULT TRUE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for family_locations table
CREATE INDEX idx_family_locations_user_id ON family_locations(user_id);
CREATE INDEX idx_family_locations_timestamp ON family_locations(timestamp DESC);
CREATE INDEX idx_family_locations_user_timestamp ON family_locations(user_id, timestamp DESC);
CREATE INDEX idx_family_locations_is_live ON family_locations(user_id, is_live) WHERE is_live = TRUE;

-- Create trigger to automatically update updated_at on families
CREATE TRIGGER update_families_updated_at
BEFORE UPDATE ON families
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE families IS 'Family groups for location sharing';
COMMENT ON TABLE family_members IS 'Members of each family group';
COMMENT ON TABLE family_locations IS 'Real-time location history for family members';
COMMENT ON COLUMN families.invite_code IS 'Unique code for inviting new family members';
COMMENT ON COLUMN family_locations.is_live IS 'Whether this is the current live location';
COMMENT ON COLUMN family_locations.accuracy IS 'GPS accuracy in meters';
