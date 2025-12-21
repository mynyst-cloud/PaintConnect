-- Add missing columns to projects table
-- Voer dit uit in de Supabase SQL Editor

-- actual_hours kolom
ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(10, 2) DEFAULT 0;
COMMENT ON COLUMN projects.actual_hours IS 'Totaal gewerkte uren op dit project';

-- is_outdoor kolom
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_outdoor BOOLEAN DEFAULT false;
COMMENT ON COLUMN projects.is_outdoor IS 'Is dit een buitenproject (voor verfcalculator)';

-- Andere mogelijk ontbrekende kolommen die de verfcalculator/projecten nodig hebben:
ALTER TABLE projects ADD COLUMN IF NOT EXISTS surface_area DECIMAL(10, 2);
COMMENT ON COLUMN projects.surface_area IS 'Totaal oppervlakte in m2';

ALTER TABLE projects ADD COLUMN IF NOT EXISTS number_of_coats INTEGER DEFAULT 2;
COMMENT ON COLUMN projects.number_of_coats IS 'Aantal verflagen';

ALTER TABLE projects ADD COLUMN IF NOT EXISTS paint_type TEXT;
COMMENT ON COLUMN projects.paint_type IS 'Type verf gebruikt';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Toon alle kolommen van projects tabel ter verificatie
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

