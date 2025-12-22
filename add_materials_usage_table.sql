-- Create materials_usage table for tracking material consumption per project
CREATE TABLE IF NOT EXISTS materials_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit TEXT,
  notes TEXT,
  usage_date DATE DEFAULT CURRENT_DATE,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_materials_usage_company ON materials_usage(company_id);
CREATE INDEX IF NOT EXISTS idx_materials_usage_project ON materials_usage(project_id);
CREATE INDEX IF NOT EXISTS idx_materials_usage_material ON materials_usage(material_id);
CREATE INDEX IF NOT EXISTS idx_materials_usage_date ON materials_usage(created_date);

-- Enable RLS
ALTER TABLE materials_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view company materials usage" ON materials_usage;
CREATE POLICY "Users can view company materials usage" ON materials_usage
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert materials usage" ON materials_usage;
CREATE POLICY "Users can insert materials usage" ON materials_usage
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update company materials usage" ON materials_usage;
CREATE POLICY "Users can update company materials usage" ON materials_usage
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete company materials usage" ON materials_usage;
CREATE POLICY "Users can delete company materials usage" ON materials_usage
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Trigger for updated_date
CREATE OR REPLACE FUNCTION update_materials_usage_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_materials_usage_updated_date ON materials_usage;
CREATE TRIGGER trigger_materials_usage_updated_date
  BEFORE UPDATE ON materials_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_materials_usage_updated_date();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';



