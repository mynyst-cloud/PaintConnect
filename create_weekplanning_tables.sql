-- ============================================
-- WEEK PLANNING UITGEBREIDE TABELLEN
-- ============================================

-- 1. VOERTUIGEN BEHEER
CREATE TABLE IF NOT EXISTS company_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- "Mercedes Sprinter", "Volkswagen Caddy"
  license_plate TEXT, -- "2-DTY-678"
  vehicle_type TEXT DEFAULT 'bestelwagen', -- bestelwagen, aanhangwagen, personenwagen
  color TEXT, -- Voor visuele identificatie
  capacity TEXT, -- "3 personen", "500kg"
  notes TEXT,
  is_available BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active', -- active, maintenance, inactive
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. VOERTUIG TOEWIJZINGEN PER DAG
CREATE TABLE IF NOT EXISTS vehicle_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES company_vehicles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  assigned_date DATE NOT NULL,
  driver_email TEXT, -- Wie rijdt
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint: voertuig kan maar 1x per dag toegewezen worden
  UNIQUE(vehicle_id, assigned_date)
);

-- 3. FREELANCERS / ONDERAANNEMERS
CREATE TABLE IF NOT EXISTS subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- "Vertuoza Menuiserie", "Jan Bakker ZZP"
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  specialty TEXT, -- "Stukadoor", "Schilder", "Elektricien"
  company_name TEXT, -- Bedrijfsnaam van de onderaannemer
  kvk_number TEXT, -- KVK nummer
  vat_number TEXT, -- BTW nummer
  hourly_rate DECIMAL(10,2),
  day_rate DECIMAL(10,2),
  notes TEXT,
  status TEXT DEFAULT 'active', -- active, inactive
  color TEXT DEFAULT 'orange', -- Voor calendar weergave
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ONDERAANNEMER TOEWIJZINGEN
CREATE TABLE IF NOT EXISTS subcontractor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  subcontractor_id UUID REFERENCES subcontractors(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  assigned_date DATE NOT NULL,
  start_time TIME DEFAULT '08:00',
  end_time TIME DEFAULT '17:00',
  task_description TEXT, -- Wat moet de onderaannemer doen
  rate_type TEXT DEFAULT 'hourly', -- hourly, daily, fixed
  agreed_rate DECIMAL(10,2),
  status TEXT DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. PROJECT TAKEN (per dag)
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL, -- "Plaatsing tegelwerk keuken op gelijkvloers"
  description TEXT,
  scheduled_date DATE,
  start_time TIME,
  end_time TIME,
  assigned_to TEXT[], -- Array van user emails
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  order_index INTEGER DEFAULT 0, -- Voor sortering binnen de dag
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. WERKNEMER DAGPLANNING (tijdslots)
CREATE TABLE IF NOT EXISTS employee_day_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  scheduled_date DATE NOT NULL,
  start_time TIME DEFAULT '08:00',
  end_time TIME DEFAULT '17:00',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Een medewerker kan maar 1x per dag aan een project toegewezen worden
  UNIQUE(user_email, project_id, scheduled_date)
);

-- 7. MATERIAAL LEVERINGEN
CREATE TABLE IF NOT EXISTS material_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  supplier_name TEXT NOT NULL, -- "VertusA", "RevMat"
  supplier_id UUID REFERENCES suppliers(id),
  delivery_type TEXT DEFAULT 'delivery', -- delivery, pickup, removal
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  description TEXT, -- Wat wordt geleverd/opgehaald
  status TEXT DEFAULT 'scheduled', -- scheduled, confirmed, delivered, cancelled
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES VOOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_company_vehicles_company ON company_vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_date ON vehicle_assignments(assigned_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_project ON vehicle_assignments(project_id);

CREATE INDEX IF NOT EXISTS idx_subcontractors_company ON subcontractors(company_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_assignments_date ON subcontractor_assignments(assigned_date);
CREATE INDEX IF NOT EXISTS idx_subcontractor_assignments_project ON subcontractor_assignments(project_id);

CREATE INDEX IF NOT EXISTS idx_project_tasks_date ON project_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);

CREATE INDEX IF NOT EXISTS idx_employee_schedules_date ON employee_day_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_employee_schedules_email ON employee_day_schedules(user_email);
CREATE INDEX IF NOT EXISTS idx_employee_schedules_project ON employee_day_schedules(project_id);

CREATE INDEX IF NOT EXISTS idx_material_deliveries_date ON material_deliveries(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_material_deliveries_project ON material_deliveries(project_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE company_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_day_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_deliveries ENABLE ROW LEVEL SECURITY;

-- Policies voor company_vehicles
CREATE POLICY "Users can view their company vehicles"
ON company_vehicles FOR SELECT
USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can insert company vehicles"
ON company_vehicles FOR INSERT
WITH CHECK (company_id IN (
  SELECT company_id FROM users 
  WHERE id = auth.uid() 
  AND (company_role = 'admin' OR company_role = 'owner' OR role = 'admin')
));

CREATE POLICY "Admins can update company vehicles"
ON company_vehicles FOR UPDATE
USING (company_id IN (
  SELECT company_id FROM users 
  WHERE id = auth.uid() 
  AND (company_role = 'admin' OR company_role = 'owner' OR role = 'admin')
));

CREATE POLICY "Admins can delete company vehicles"
ON company_vehicles FOR DELETE
USING (company_id IN (
  SELECT company_id FROM users 
  WHERE id = auth.uid() 
  AND (company_role = 'admin' OR company_role = 'owner' OR role = 'admin')
));

-- Policies voor vehicle_assignments
CREATE POLICY "Users can view their company vehicle assignments"
ON vehicle_assignments FOR SELECT
USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage vehicle assignments"
ON vehicle_assignments FOR ALL
USING (company_id IN (
  SELECT company_id FROM users 
  WHERE id = auth.uid() 
  AND (company_role = 'admin' OR company_role = 'owner' OR role = 'admin')
));

-- Policies voor subcontractors
CREATE POLICY "Users can view their company subcontractors"
ON subcontractors FOR SELECT
USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage subcontractors"
ON subcontractors FOR ALL
USING (company_id IN (
  SELECT company_id FROM users 
  WHERE id = auth.uid() 
  AND (company_role = 'admin' OR company_role = 'owner' OR role = 'admin')
));

-- Policies voor subcontractor_assignments
CREATE POLICY "Users can view their company subcontractor assignments"
ON subcontractor_assignments FOR SELECT
USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage subcontractor assignments"
ON subcontractor_assignments FOR ALL
USING (company_id IN (
  SELECT company_id FROM users 
  WHERE id = auth.uid() 
  AND (company_role = 'admin' OR company_role = 'owner' OR role = 'admin')
));

-- Policies voor project_tasks
CREATE POLICY "Users can view their company tasks"
ON project_tasks FOR SELECT
USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage project tasks"
ON project_tasks FOR ALL
USING (company_id IN (
  SELECT company_id FROM users 
  WHERE id = auth.uid() 
  AND (company_role = 'admin' OR company_role = 'owner' OR role = 'admin')
));

-- Policies voor employee_day_schedules
CREATE POLICY "Users can view their company schedules"
ON employee_day_schedules FOR SELECT
USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage employee schedules"
ON employee_day_schedules FOR ALL
USING (company_id IN (
  SELECT company_id FROM users 
  WHERE id = auth.uid() 
  AND (company_role = 'admin' OR company_role = 'owner' OR role = 'admin')
));

-- Policies voor material_deliveries
CREATE POLICY "Users can view their company deliveries"
ON material_deliveries FOR SELECT
USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage material deliveries"
ON material_deliveries FOR ALL
USING (company_id IN (
  SELECT company_id FROM users 
  WHERE id = auth.uid() 
  AND (company_role = 'admin' OR company_role = 'owner' OR role = 'admin')
));

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_vehicles_updated_at
  BEFORE UPDATE ON company_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_assignments_updated_at
  BEFORE UPDATE ON vehicle_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcontractors_updated_at
  BEFORE UPDATE ON subcontractors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcontractor_assignments_updated_at
  BEFORE UPDATE ON subcontractor_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_schedules_updated_at
  BEFORE UPDATE ON employee_day_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_deliveries_updated_at
  BEFORE UPDATE ON material_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


