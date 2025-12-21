-- Fix all existing projects with invalid statuses
-- Voer dit uit in de Supabase SQL Editor

-- STAP 1: Bekijk huidige statussen in de database
SELECT DISTINCT status, COUNT(*) as count
FROM projects
GROUP BY status
ORDER BY count DESC;

-- STAP 2: Update alle projecten met ongeldige statussen naar geldige waarden
UPDATE projects 
SET status = CASE 
  -- Map oude statussen naar nieuwe geldige statussen
  WHEN status = 'niet_gestart' THEN 'nieuw'
  WHEN status = 'bijna_klaar' THEN 'planning'
  WHEN status = 'voltooid' THEN 'afgerond'
  WHEN status = 'gepauzeerd' THEN 'on_hold'
  WHEN status = 'actief' THEN 'in_uitvoering'
  -- Voor elk andere ongeldige status, zet naar 'nieuw'
  WHEN status NOT IN ('nieuw', 'planning', 'in_uitvoering', 'afgerond', 'geannuleerd', 'on_hold', 'offerte') THEN 'nieuw'
  -- Behoud geldige statussen
  ELSE status
END
WHERE status IS NULL OR status NOT IN ('nieuw', 'planning', 'in_uitvoering', 'afgerond', 'geannuleerd', 'on_hold', 'offerte');

-- STAP 3: Update alle NULL statussen naar 'nieuw'
UPDATE projects SET status = 'nieuw' WHERE status IS NULL;

-- STAP 4: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- STAP 5: Verificatie - toon alle statussen na de update
SELECT DISTINCT status, COUNT(*) as count
FROM projects
GROUP BY status
ORDER BY count DESC;

-- STAP 6: Toon eventuele projecten die nog steeds ongeldige statussen hebben
-- (dit zou leeg moeten zijn)
SELECT id, project_name, status
FROM projects
WHERE status NOT IN ('nieuw', 'planning', 'in_uitvoering', 'afgerond', 'geannuleerd', 'on_hold', 'offerte')
OR status IS NULL
LIMIT 10;

