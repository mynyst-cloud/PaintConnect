-- Migration: Add ip_address column to magic_links table for rate limiting
-- Run this in Supabase SQL Editor if the table already exists

-- Add ip_address column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'magic_links' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE magic_links ADD COLUMN ip_address TEXT;
  END IF;
END $$;

-- Create index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_magic_links_email_created ON magic_links(email, created_at);
CREATE INDEX IF NOT EXISTS idx_magic_links_ip_created ON magic_links(ip_address, created_at);

-- Update expiry default if needed
ALTER TABLE magic_links 
  ALTER COLUMN expires_at SET DEFAULT NOW() + INTERVAL '10 minutes';

SELECT 'Migration completed: ip_address column added to magic_links' as result;

