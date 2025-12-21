-- =====================================================
-- CREATE NOTIFICATIONS TABLE
-- =====================================================
-- In-app notification system voor PaintConnect

-- Drop existing table if needed (backup first in production!)
-- DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recipient info (one of these must be set)
    recipient_email TEXT,           -- Email of the recipient (preferred)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Company context
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Notification content
    type TEXT NOT NULL DEFAULT 'generic',
    title TEXT,
    message TEXT NOT NULL,
    
    -- Link to relevant page/resource
    link_to TEXT,
    
    -- Related entities (for quick filtering)
    project_id UUID,
    
    -- Extra data (JSON)
    data JSONB DEFAULT '{}',
    
    -- Status
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Timestamps
    created_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_email ON notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_date ON notifications(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can manage all" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;

-- Users can view their own notifications (by email or user_id)
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT
    USING (
        recipient_email = auth.jwt() ->> 'email'
        OR user_id = auth.uid()
    );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE
    USING (
        recipient_email = auth.jwt() ->> 'email'
        OR user_id = auth.uid()
    )
    WITH CHECK (
        recipient_email = auth.jwt() ->> 'email'
        OR user_id = auth.uid()
    );

-- Authenticated users can create notifications (for sending to others)
CREATE POLICY "Authenticated users can create notifications" ON notifications
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Service role can do everything (for Edge Functions)
CREATE POLICY "Service role can manage all" ON notifications
    FOR ALL
    USING (true);

-- =====================================================
-- HELPER FUNCTION: Create notification
-- =====================================================

CREATE OR REPLACE FUNCTION create_notification(
    p_recipient_email TEXT,
    p_type TEXT DEFAULT 'generic',
    p_title TEXT DEFAULT NULL,
    p_message TEXT DEFAULT '',
    p_link_to TEXT DEFAULT NULL,
    p_project_id UUID DEFAULT NULL,
    p_company_id UUID DEFAULT NULL,
    p_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
    v_user_id UUID;
BEGIN
    -- Try to find user_id from email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_recipient_email
    LIMIT 1;
    
    -- Insert notification
    INSERT INTO notifications (
        recipient_email,
        user_id,
        company_id,
        type,
        title,
        message,
        link_to,
        project_id,
        data,
        read,
        created_date,
        created_at
    ) VALUES (
        p_recipient_email,
        v_user_id,
        p_company_id,
        p_type,
        p_title,
        p_message,
        p_link_to,
        p_project_id,
        p_data,
        FALSE,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- =====================================================
-- HELPER FUNCTION: Mark all as read for user
-- =====================================================

CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_email TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications
    SET read = TRUE, read_at = NOW()
    WHERE recipient_email = p_user_email
    AND read = FALSE;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- Reload schema
NOTIFY pgrst, 'reload schema';

SELECT 'Notifications table created successfully!' as status;

