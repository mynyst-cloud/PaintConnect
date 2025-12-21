-- Fix projects status check constraint
-- Voer dit uit in de Supabase SQL Editor

-- STAP 1: Bekijk welke statussen er momenteel zijn
SELECT DISTINCT status, COUNT(*) as count
FROM projects
WHERE status IS NOT NULL
GROUP BY status
ORDER BY count DESC;

-- STAP 2: Corrigeer ongeldige statussen naar geldige waarden
-- Voeg eerst de kolommen toe als ze niet bestaan
ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_outdoor BOOLEAN DEFAULT false;

-- STAP 3: Update alle NULL statussen naar 'nieuw'
UPDATE projects SET status = 'nieuw' WHERE status IS NULL;

-- STAP 4: Update mogelijke ongeldige statussen
-- (pas dit aan op basis van de resultaten van STAP 1)
UPDATE projects SET status = 'nieuw' WHERE status NOT IN ('nieuw', 'planning', 'in_uitvoering', 'afgerond', 'geannuleerd', 'on_hold', 'offerte');

-- STAP 5: Nu kunnen we de constraint veilig verwijderen en opnieuw aanmaken
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- STAP 6: Voeg de nieuwe constraint toe
ALTER TABLE projects ADD CONSTRAINT projects_status_check 
CHECK (status IN ('nieuw', 'planning', 'in_uitvoering', 'afgerond', 'geannuleerd', 'on_hold', 'offerte'));

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

