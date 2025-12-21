-- Fix projects status check constraint
-- Voer dit uit in de Supabase SQL Editor

-- STAP 1: Bekijk welke statussen er momenteel zijn
SELECT DISTINCT status, COUNT(*) as count
FROM projects
WHERE status IS NOT NULL
GROUP BY status
ORDER BY count DESC;

-- STAP 2: Verwijder EERST de oude constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- STAP 3: Voeg ontbrekende kolommen toe
ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_outdoor BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS surface_area DECIMAL(10, 2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS number_of_coats INTEGER DEFAULT 2;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS paint_type TEXT;

-- STAP 4: Update alle NULL statussen naar 'nieuw'
UPDATE projects SET status = 'nieuw' WHERE status IS NULL;

-- STAP 5: Update mogelijke ongeldige statussen naar 'nieuw'
UPDATE projects SET status = 'nieuw' WHERE status NOT IN ('nieuw', 'planning', 'in_uitvoering', 'afgerond', 'geannuleerd', 'on_hold', 'offerte');

-- STAP 6: Voeg de nieuwe, verbeterde constraint toe
ALTER TABLE projects ADD CONSTRAINT projects_status_check 
CHECK (status IN ('nieuw', 'planning', 'in_uitvoering', 'afgerond', 'geannuleerd', 'on_hold', 'offerte'));

-- STAP 7: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- STAP 8: Verificatie - toon alle kolommen
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- Toon alle bestaande statussen in de database om te zien wat er gebruikt wordt
SELECT DISTINCT status, COUNT(*) as count
FROM projects
GROUP BY status
ORDER BY count DESC;

-- Toon alle kolommen van projects voor verificatie
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

