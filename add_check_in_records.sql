-- Check-in Records Table voor Team Activiteit
-- Voer dit uit in de Supabase SQL Editor

-- Maak de check_in_records tabel aan
CREATE TABLE IF NOT EXISTS check_in_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- User en Company
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Project
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  project_name TEXT,
  project_address TEXT,
  
  -- Check-in/out tijden
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  -- Status: 'checked_in' of 'checked_out'
  status TEXT NOT NULL DEFAULT 'checked_in',
  
  -- GPS Locatie bij check-in
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name TEXT,
  distance_from_site DECIMAL(10, 2), -- afstand in meters van project locatie
  within_range BOOLEAN DEFAULT true,
  
  -- Op tijd status
  is_on_time BOOLEAN DEFAULT true,
  expected_start_time TIME,
  
  -- Notities
  notes TEXT,
  check_out_notes TEXT,
  
  -- Woon-werkverkeer (berekend via Google Maps API)
  travel_outbound JSONB, -- { distance_km, duration_min, start_address, end_address }
  travel_return JSONB,   -- { distance_km, duration_min, start_address, end_address }
  total_travel_time INTEGER, -- totale reistijd in minuten
  total_travel_distance DECIMAL(10, 2), -- totale afstand in km
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('checked_in', 'checked_out'))
);

-- Indexen voor snelle queries
CREATE INDEX IF NOT EXISTS idx_check_in_records_user_id ON check_in_records(user_id);
CREATE INDEX IF NOT EXISTS idx_check_in_records_company_id ON check_in_records(company_id);
CREATE INDEX IF NOT EXISTS idx_check_in_records_project_id ON check_in_records(project_id);
CREATE INDEX IF NOT EXISTS idx_check_in_records_status ON check_in_records(status);
CREATE INDEX IF NOT EXISTS idx_check_in_records_check_in_time ON check_in_records(check_in_time);
CREATE INDEX IF NOT EXISTS idx_check_in_records_company_date ON check_in_records(company_id, check_in_time);

-- RLS (Row Level Security) policies
ALTER TABLE check_in_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own check-ins" ON check_in_records;
DROP POLICY IF EXISTS "Admins can view company check-ins" ON check_in_records;
DROP POLICY IF EXISTS "Users can create own check-ins" ON check_in_records;
DROP POLICY IF EXISTS "Users can update own check-ins" ON check_in_records;
DROP POLICY IF EXISTS "Admins can manage company check-ins" ON check_in_records;

-- Policy: Gebruikers kunnen hun eigen check-ins zien
CREATE POLICY "Users can view own check-ins" ON check_in_records
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins kunnen alle check-ins van hun bedrijf zien
CREATE POLICY "Admins can view company check-ins" ON check_in_records
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND company_role IN ('admin', 'owner')
    )
  );

-- Policy: Gebruikers kunnen hun eigen check-ins aanmaken
CREATE POLICY "Users can create own check-ins" ON check_in_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Gebruikers kunnen hun eigen actieve check-in updaten (voor check-out)
CREATE POLICY "Users can update own check-ins" ON check_in_records
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Admins kunnen check-ins van hun bedrijf updaten/verwijderen
CREATE POLICY "Admins can manage company check-ins" ON check_in_records
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND company_role IN ('admin', 'owner')
    )
  );

-- Trigger voor updated_date
CREATE OR REPLACE FUNCTION update_check_in_records_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_in_records_updated_date
  BEFORE UPDATE ON check_in_records
  FOR EACH ROW
  EXECUTE FUNCTION update_check_in_records_updated_date();

-- Commentaar
COMMENT ON TABLE check_in_records IS 'Registratie van check-ins en check-outs van teamleden op projectlocaties';
COMMENT ON COLUMN check_in_records.travel_outbound IS 'Reisgegevens heenreis: { distance_km, duration_min, start_address, end_address }';
COMMENT ON COLUMN check_in_records.travel_return IS 'Reisgegevens terugreis: { distance_km, duration_min, start_address, end_address }';

