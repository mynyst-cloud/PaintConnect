-- Create magic_links table for custom magic link authentication
-- Run this in Supabase SQL Editor

-- Drop existing table if it exists (for clean re-runs)
DROP TABLE IF EXISTS magic_links CASCADE;

-- Create magic_links table
CREATE TABLE magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  redirect_to TEXT DEFAULT '/Dashboard',
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT -- Store IP for rate limiting
);

-- Create index for fast token lookups
CREATE INDEX idx_magic_links_token ON magic_links(token);

-- Create index for cleanup queries
CREATE INDEX idx_magic_links_expires_at ON magic_links(expires_at);
-- Create index for rate limiting queries
CREATE INDEX idx_magic_links_email_created ON magic_links(email, created_at);
CREATE INDEX idx_magic_links_ip_created ON magic_links(ip_address, created_at);

-- Add comments
COMMENT ON TABLE magic_links IS 'Stores magic link tokens for passwordless login via Resend';
COMMENT ON COLUMN magic_links.token IS 'Unique token sent in the magic link email';
COMMENT ON COLUMN magic_links.used IS 'Whether the token has been used';
COMMENT ON COLUMN magic_links.expires_at IS 'Token expires after 10 minutes';

-- Enable RLS
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (Edge Functions use service role)
-- No user-facing policies needed since this is handled server-side

-- Create a function to clean up expired/used tokens (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_magic_links()
RETURNS void AS $$
BEGIN
  DELETE FROM magic_links 
  WHERE expires_at < NOW() - INTERVAL '1 day'
     OR (used = true AND used_at < NOW() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

SELECT 'magic_links table created successfully' as result;



