-- Migration 006: Create Notifications System
-- Creates tables for user notifications and notification preferences

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for notifications table
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_read_created ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Create notification_settings table
CREATE TABLE notification_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  community_activity BOOLEAN DEFAULT TRUE NOT NULL,
  followed_locations BOOLEAN DEFAULT TRUE NOT NULL,
  safety_alerts BOOLEAN DEFAULT TRUE NOT NULL,
  system_updates BOOLEAN DEFAULT TRUE NOT NULL,
  family_alerts BOOLEAN DEFAULT TRUE NOT NULL,
  push_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create trigger to automatically update updated_at on notification_settings
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON notification_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'User notifications for various events and activities';
COMMENT ON TABLE notification_settings IS 'User preferences for notification types';
COMMENT ON COLUMN notifications.type IS 'Type of notification (e.g., tip_comment, family_alert, safety_alert)';
COMMENT ON COLUMN notifications.data IS 'Additional JSON data related to the notification (e.g., tip_id, comment_id)';
COMMENT ON COLUMN notification_settings.community_activity IS 'Notifications for community tips and comments';
COMMENT ON COLUMN notification_settings.followed_locations IS 'Notifications for updates in followed locations';
COMMENT ON COLUMN notification_settings.safety_alerts IS 'Critical safety alerts';
COMMENT ON COLUMN notification_settings.system_updates IS 'App updates and system messages';
COMMENT ON COLUMN notification_settings.family_alerts IS 'Family location and safety alerts';
COMMENT ON COLUMN notification_settings.push_enabled IS 'Master switch for all push notifications';
