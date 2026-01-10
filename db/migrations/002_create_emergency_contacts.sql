-- Migration 002: Create Emergency Contacts Table
-- Stores user's emergency contacts for safety features

CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for emergency_contacts table
CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX idx_emergency_contacts_user_order ON emergency_contacts(user_id, "order");

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_emergency_contacts_updated_at
BEFORE UPDATE ON emergency_contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE emergency_contacts IS 'Emergency contacts for each user';
COMMENT ON COLUMN emergency_contacts."order" IS 'Order of priority for contacting (1 = first contact)';
