-- Update pending_invites table with required columns
-- Run this in Supabase SQL Editor

-- Add missing columns if they don't exist
ALTER TABLE pending_invites 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS company_role TEXT DEFAULT 'painter',
ADD COLUMN IF NOT EXISTS is_painter BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS home_address TEXT,
ADD COLUMN IF NOT EXISTS token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);

-- Ensure token is unique
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pending_invites_token_key'
  ) THEN
    ALTER TABLE pending_invites ADD CONSTRAINT pending_invites_token_key UNIQUE (token);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add index on token for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_invites_token ON pending_invites(token);

-- Add index on email and company_id for duplicate checks
CREATE INDEX IF NOT EXISTS idx_pending_invites_email_company ON pending_invites(email, company_id);

-- Add comments
COMMENT ON TABLE pending_invites IS 'Stores pending invitations for painters and team members';
COMMENT ON COLUMN pending_invites.token IS 'Unique token used in invitation link';
COMMENT ON COLUMN pending_invites.expires_at IS 'When the invitation expires (default 7 days)';
COMMENT ON COLUMN pending_invites.accepted_at IS 'When the invitation was accepted';

-- RLS Policies
ALTER TABLE pending_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Company admins can view their invites" ON pending_invites;
DROP POLICY IF EXISTS "Company admins can create invites" ON pending_invites;
DROP POLICY IF EXISTS "Company admins can update invites" ON pending_invites;
DROP POLICY IF EXISTS "Users can view their own invites" ON pending_invites;

-- Allow company admins to manage invites
CREATE POLICY "Company admins can view their invites" ON pending_invites
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND (company_role = 'admin' OR company_role = 'owner')
    )
  );

CREATE POLICY "Company admins can create invites" ON pending_invites
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND (company_role = 'admin' OR company_role = 'owner')
    )
  );

CREATE POLICY "Company admins can update invites" ON pending_invites
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND (company_role = 'admin' OR company_role = 'owner')
    )
  );

-- Allow users to view invites sent to their email
CREATE POLICY "Users can view their own invites" ON pending_invites
  FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

SELECT 'pending_invites table updated successfully' as result;



