-- Migration 002: Allow Nullable Password for Google-Only Accounts
-- This migration enables users to sign in exclusively via Google OAuth
-- by making password_hash nullable and adding a constraint to ensure
-- at least one authentication method (password OR Google) exists

BEGIN;

-- Make password_hash nullable to support Google-only accounts
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add constraint to ensure at least one authentication method exists
-- User must have either a password_hash OR a google_id (or both for linked accounts)
ALTER TABLE users ADD CONSTRAINT user_auth_method_check
  CHECK (
    (password_hash IS NOT NULL AND password_hash != '')
    OR
    google_id IS NOT NULL
  );

-- Add comment for documentation
COMMENT ON CONSTRAINT user_auth_method_check ON users IS
  'Ensures user has at least one authentication method (password or Google)';

COMMIT;
