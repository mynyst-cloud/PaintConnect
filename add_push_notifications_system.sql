-- =====================================================
-- PUSH NOTIFICATIONS SYSTEM FOR PAINTCONNECT
-- =====================================================
-- This creates the infrastructure for OneSignal push notifications
-- with check-in/out reminders based on project work schedules

-- 1. Create push_subscriptions table
-- =====================================================
DROP TABLE IF EXISTS push_subscriptions CASCADE;

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  onesignal_player_id TEXT NOT NULL,
  device_type TEXT DEFAULT 'web',
  is_active BOOLEAN DEFAULT true,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, onesignal_player_id)
);

-- Indexes for push_subscriptions
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_player ON push_subscriptions(onesignal_player_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = true;

-- RLS for push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions
  FOR DELETE USING (user_id = auth.uid());

-- 2. Add work schedule columns to projects
-- =====================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS work_start_time TIME DEFAULT '08:00:00';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS work_end_time TIME DEFAULT '17:00:00';

COMMENT ON COLUMN projects.work_start_time IS 'Start tijd van de werkdag voor dit project';
COMMENT ON COLUMN projects.work_end_time IS 'Eind tijd van de werkdag voor dit project';

-- 3. Create push_notification_log table for tracking sent notifications
-- =====================================================
DROP TABLE IF EXISTS push_notification_log CASCADE;

CREATE TABLE push_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL, -- 'check_in_reminder', 'check_out_reminder', 'general'
  title TEXT NOT NULL,
  message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  onesignal_response JSONB,
  was_opened BOOLEAN DEFAULT false,
  opened_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for notification log
CREATE INDEX idx_push_log_user ON push_notification_log(user_id);
CREATE INDEX idx_push_log_project ON push_notification_log(project_id);
CREATE INDEX idx_push_log_type ON push_notification_log(notification_type);
CREATE INDEX idx_push_log_sent ON push_notification_log(sent_at);

-- RLS for push_notification_log
ALTER TABLE push_notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification log" ON push_notification_log
  FOR SELECT USING (user_id = auth.uid());

-- Admins can view all (using service role key in Edge Functions)
CREATE POLICY "Service role can manage all notifications" ON push_notification_log
  FOR ALL USING (true);

-- 4. Create project_assignments table for tracking which painters are assigned
-- =====================================================
-- Check if table already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'project_assignments') THEN
    CREATE TABLE project_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      assigned_by UUID REFERENCES auth.users(id),
      assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      is_active BOOLEAN DEFAULT true,
      UNIQUE(project_id, user_id)
    );

    CREATE INDEX idx_project_assignments_project ON project_assignments(project_id);
    CREATE INDEX idx_project_assignments_user ON project_assignments(user_id);
    CREATE INDEX idx_project_assignments_active ON project_assignments(is_active) WHERE is_active = true;

    ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view project assignments in their company" ON project_assignments
      FOR SELECT USING (
        project_id IN (
          SELECT id FROM projects WHERE company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
          )
        )
      );

    CREATE POLICY "Admins can manage project assignments" ON project_assignments
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND company_role IN ('admin', 'owner')
        )
      );
  END IF;
END $$;

-- 5. Update triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_push_subscriptions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_push_subscriptions_updated ON push_subscriptions;
CREATE TRIGGER trigger_push_subscriptions_updated
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_timestamp();

-- 6. Notify PostgREST to reload schema
-- =====================================================
NOTIFY pgrst, 'reload schema';

-- Done!
SELECT 'Push notifications system tables created successfully!' as status;


