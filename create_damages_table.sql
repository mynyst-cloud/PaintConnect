-- Create damages table if not exists
CREATE TABLE IF NOT EXISTS damages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  severity TEXT,
  location TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  reported_by TEXT,
  visible_to_client BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add all potentially missing columns (for existing tables)
DO $$
BEGIN
  -- category
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'damages' AND column_name = 'category'
  ) THEN
    ALTER TABLE damages ADD COLUMN category TEXT;
  END IF;
  
  -- severity
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'damages' AND column_name = 'severity'
  ) THEN
    ALTER TABLE damages ADD COLUMN severity TEXT;
  END IF;
  
  -- location
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'damages' AND column_name = 'location'
  ) THEN
    ALTER TABLE damages ADD COLUMN location TEXT;
  END IF;
  
  -- photo_urls
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'damages' AND column_name = 'photo_urls'
  ) THEN
    ALTER TABLE damages ADD COLUMN photo_urls TEXT[] DEFAULT '{}';
  END IF;
  
  -- reported_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'damages' AND column_name = 'reported_by'
  ) THEN
    ALTER TABLE damages ADD COLUMN reported_by TEXT;
  END IF;
  
  -- visible_to_client
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'damages' AND column_name = 'visible_to_client'
  ) THEN
    ALTER TABLE damages ADD COLUMN visible_to_client BOOLEAN DEFAULT true;
  END IF;
  
  -- created_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'damages' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE damages ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'damages' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE damages ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add RLS policies
ALTER TABLE damages ENABLE ROW LEVEL SECURITY;

-- Policy for viewing damages (company members can view)
DROP POLICY IF EXISTS "Users can view company damages" ON damages;
CREATE POLICY "Users can view company damages"
  ON damages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.company_id = damages.company_id
    )
  );

-- Policy for admins to manage damages
DROP POLICY IF EXISTS "Admins can manage company damages" ON damages;
CREATE POLICY "Admins can manage company damages"
  ON damages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.company_id = damages.company_id
      AND (public.users.company_role = 'admin' OR public.users.role = 'admin')
    )
  );

-- Policy for painters to create damages (report damage)
DROP POLICY IF EXISTS "Painters can create damages" ON damages;
CREATE POLICY "Painters can create damages"
  ON damages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.company_id = damages.company_id
    )
  );

-- Policy for super_admins to view all damages
DROP POLICY IF EXISTS "Super admins can view all damages" ON damages;
CREATE POLICY "Super admins can view all damages"
  ON damages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'super_admin'
    )
  );

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_damages_company_id ON damages(company_id);
CREATE INDEX IF NOT EXISTS idx_damages_project_id ON damages(project_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_damages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_damages_updated_at ON damages;
CREATE TRIGGER set_damages_updated_at
BEFORE UPDATE ON damages
FOR EACH ROW
EXECUTE FUNCTION update_damages_updated_at();

