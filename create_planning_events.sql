-- Create planning_events table if not exists
CREATE TABLE IF NOT EXISTS planning_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'feestdag',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  color TEXT DEFAULT 'gray',
  affected_painters TEXT[] DEFAULT '{}',
  is_recurring BOOLEAN DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add affected_painters column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planning_events' AND column_name = 'affected_painters'
  ) THEN
    ALTER TABLE planning_events ADD COLUMN affected_painters TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Add all potentially missing columns (for existing tables)
DO $$
BEGIN
  -- event_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planning_events' AND column_name = 'event_type'
  ) THEN
    ALTER TABLE planning_events ADD COLUMN event_type TEXT DEFAULT 'feestdag';
    -- Update any existing rows that might be NULL
    UPDATE planning_events SET event_type = 'feestdag' WHERE event_type IS NULL;
  END IF;
  
  -- color
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planning_events' AND column_name = 'color'
  ) THEN
    ALTER TABLE planning_events ADD COLUMN color TEXT DEFAULT 'gray';
  END IF;
  
  -- start_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planning_events' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE planning_events ADD COLUMN start_date DATE;
  END IF;
  
  -- end_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planning_events' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE planning_events ADD COLUMN end_date DATE;
  END IF;
  
  -- description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planning_events' AND column_name = 'description'
  ) THEN
    ALTER TABLE planning_events ADD COLUMN description TEXT;
  END IF;
  
  -- is_recurring
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planning_events' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE planning_events ADD COLUMN is_recurring BOOLEAN DEFAULT false;
  END IF;
  
  -- created_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planning_events' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE planning_events ADD COLUMN created_by TEXT;
  END IF;
  
  -- created_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planning_events' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE planning_events ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planning_events' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE planning_events ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add RLS policies
ALTER TABLE planning_events ENABLE ROW LEVEL SECURITY;

-- Policy for viewing planning events (company members can view)
DROP POLICY IF EXISTS "Users can view company planning events" ON planning_events;
CREATE POLICY "Users can view company planning events"
  ON planning_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.company_id = planning_events.company_id
    )
  );

-- Policy for admins to manage planning events
DROP POLICY IF EXISTS "Admins can manage company planning events" ON planning_events;
CREATE POLICY "Admins can manage company planning events"
  ON planning_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.company_id = planning_events.company_id
      AND (public.users.company_role = 'admin' OR public.users.role = 'admin')
    )
  );

-- Policy for super_admins to view all planning events
DROP POLICY IF EXISTS "Super admins can view all planning events" ON planning_events;
CREATE POLICY "Super admins can view all planning events"
  ON planning_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'super_admin'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_planning_events_company_id ON planning_events(company_id);
CREATE INDEX IF NOT EXISTS idx_planning_events_dates ON planning_events(start_date, end_date);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_planning_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_planning_events_updated_at ON planning_events;
CREATE TRIGGER set_planning_events_updated_at
BEFORE UPDATE ON planning_events
FOR EACH ROW
EXECUTE FUNCTION update_planning_events_updated_at();

