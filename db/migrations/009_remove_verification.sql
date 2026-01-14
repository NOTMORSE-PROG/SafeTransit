-- Migration 009: Remove Verification System
-- Drops the verification_requests table and related objects

-- Drop the trigger first
DROP TRIGGER IF EXISTS update_verification_requests_updated_at ON verification_requests;

-- Drop indexes
DROP INDEX IF EXISTS idx_verification_requests_user_id;
DROP INDEX IF EXISTS idx_verification_requests_status;
DROP INDEX IF EXISTS idx_verification_requests_created_at;

-- Drop the verification_requests table
DROP TABLE IF EXISTS verification_requests;

-- Drop the enum type
DROP TYPE IF EXISTS verification_req_status;
