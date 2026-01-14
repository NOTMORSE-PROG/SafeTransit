-- Migration 010: Remove Verification from Users
-- Drops verification-related columns and enum from users table

-- Drop the index first
DROP INDEX IF EXISTS idx_users_verification_status;

-- Remove the verification columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS is_verified;
ALTER TABLE users DROP COLUMN IF EXISTS verification_status;

-- Drop the verification_status enum type
DROP TYPE IF EXISTS verification_status;
