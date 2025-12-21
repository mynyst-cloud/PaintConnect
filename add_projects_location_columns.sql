-- Add location and time tracking columns to projects table
-- Voer dit uit in de Supabase SQL Editor

-- Latitude kolom (decimaal getal voor GPS coördinaten)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
COMMENT ON COLUMN projects.latitude IS 'GPS Latitude van projectlocatie';

-- Longitude kolom (decimaal getal voor GPS coördinaten)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
COMMENT ON COLUMN projects.longitude IS 'GPS Longitude van projectlocatie';

-- Expected start time kolom (tijd zonder datum)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS expected_start_time TIME;
COMMENT ON COLUMN projects.expected_start_time IS 'Verwachte starttijd (bijv. 08:00:00)';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Toon de nieuwe kolommen ter verificatie
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'projects'
AND column_name IN ('latitude', 'longitude', 'expected_start_time', 'full_address')
ORDER BY column_name;


