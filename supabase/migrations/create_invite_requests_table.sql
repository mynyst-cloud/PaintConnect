-- Create invite_requests table
CREATE TABLE IF NOT EXISTS invite_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  company_name TEXT,
  name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'contacted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contacted_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(email)
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_invite_requests_email ON invite_requests(email);
CREATE INDEX IF NOT EXISTS idx_invite_requests_status ON invite_requests(status);
CREATE INDEX IF NOT EXISTS idx_invite_requests_created_at ON invite_requests(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE invite_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for the invite form)
CREATE POLICY "Allow public insert on invite_requests"
  ON invite_requests
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only admins can read invite requests
-- Note: This requires the users table to have company_role column
-- For now, we'll allow service role to read (Edge Functions use service role)
-- In production, you might want to add a proper admin check policy

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invite_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_invite_requests_updated_at
  BEFORE UPDATE ON invite_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_invite_requests_updated_at();

