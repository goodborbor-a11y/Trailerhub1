-- Migration: Add Google OAuth support
-- Run with: psql -U movieapp -d movietrailers -f migrations/add_google_oauth.sql

-- Add google_id column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Make password_hash nullable (for OAuth users who don't have passwords)
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- Add auth_provider column to track how user signed up
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'email' CHECK (auth_provider IN ('email', 'google'));

-- Update existing users to have 'email' as auth_provider
UPDATE users SET auth_provider = 'email' WHERE auth_provider IS NULL;

