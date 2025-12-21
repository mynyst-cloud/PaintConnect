-- Fix projects status check constraint
-- Voer dit uit in de Supabase SQL Editor

-- Eerst: bekijk de huidige constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'projects_status_check';

-- Verwijder de oude constraint (als die bestaat)
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Voeg een nieuwe, correcte constraint toe met alle mogelijke statussen
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

