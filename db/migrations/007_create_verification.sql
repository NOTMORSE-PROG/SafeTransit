-- Migration 007: Create Verification and Followed Locations
-- Creates tables for user verification and location following features

-- Create enum for verification status
CREATE TYPE verification_req_status AS ENUM ('pending', 'approved', 'rejected');

-- Create verification_requests table
CREATE TABLE verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  face_image_url TEXT NOT NULL,
  id_front_url TEXT NOT NULL,
  id_back_url TEXT,
  id_type VARCHAR(100) NOT NULL,
  status verification_req_status DEFAULT 'pending' NOT NULL,
  rejection_reason TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for verification_requests table
CREATE INDEX idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
CREATE INDEX idx_verification_requests_created_at ON verification_requests(created_at DESC);

-- Create followed_locations table
CREATE TABLE followed_locations (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius INTEGER DEFAULT 500 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (user_id, location_name)
);

-- Create indexes for followed_locations table
CREATE INDEX idx_followed_locations_user_id ON followed_locations(user_id);
CREATE INDEX idx_followed_locations_location ON followed_locations(latitude, longitude);

-- Create trigger to automatically update updated_at on verification_requests
CREATE TRIGGER update_verification_requests_updated_at
BEFORE UPDATE ON verification_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE verification_requests IS 'User identity verification requests';
COMMENT ON TABLE followed_locations IS 'Locations that users follow for safety updates';
COMMENT ON COLUMN verification_requests.face_image_url IS 'URL to user selfie/face photo for verification';
COMMENT ON COLUMN verification_requests.id_front_url IS 'URL to front of government ID';
COMMENT ON COLUMN verification_requests.id_back_url IS 'URL to back of government ID (optional)';
COMMENT ON COLUMN verification_requests.id_type IS 'Type of ID provided (e.g., passport, drivers_license)';
COMMENT ON COLUMN verification_requests.rejection_reason IS 'Reason for rejection if status is rejected';
COMMENT ON COLUMN followed_locations.radius IS 'Notification radius in meters';
