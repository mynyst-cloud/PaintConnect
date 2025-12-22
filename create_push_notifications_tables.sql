-- =====================================================
-- PUSH NOTIFICATIONS TABLES
-- =====================================================
-- Tables for OneSignal push notification integration

-- =====================================================
-- 1. PUSH SUBSCRIPTIONS TABLE
-- =====================================================
-- Stores OneSignal player IDs for each user's devices

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User reference
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    
    -- OneSignal player ID (unique per device)
    onesignal_player_id TEXT NOT NULL UNIQUE,
    
    -- Device info
    device_type TEXT, -- 'web', 'android', 'ios'
    device_name TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_email ON push_subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_player_id ON push_subscriptions(onesignal_player_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);

-- =====================================================
-- 2. PUSH NOTIFICATION LOG TABLE
-- =====================================================
-- Logs all sent push notifications for debugging and analytics

CREATE TABLE IF NOT EXISTS push_notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Target user
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Context
    project_id UUID,
    
    -- Notification content
    notification_type TEXT NOT NULL,
    title TEXT,
    message TEXT,
    
    -- OneSignal response
    onesignal_response JSONB,
    
    -- Status
    status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'clicked', 'failed'
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_log_user_id ON push_notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_push_log_created ON push_notification_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_log_type ON push_notification_log(notification_type);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_log ENABLE ROW LEVEL SECURITY;

-- Push subscriptions: Users can manage their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON push_subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions" ON push_subscriptions
    FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own subscriptions" ON push_subscriptions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own subscriptions" ON push_subscriptions
    FOR DELETE USING (user_id = auth.uid());

-- Push notification log: Users can view their own logs
CREATE POLICY "Users can view own push logs" ON push_notification_log
    FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- HELPER FUNCTION: Register push subscription
-- =====================================================

CREATE OR REPLACE FUNCTION register_push_subscription(
    p_user_id UUID,
    p_user_email TEXT,
    p_player_id TEXT,
    p_device_type TEXT DEFAULT 'web',
    p_device_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription_id UUID;
BEGIN
    -- Upsert subscription (update if exists, insert if not)
    INSERT INTO push_subscriptions (
        user_id,
        user_email,
        onesignal_player_id,
        device_type,
        device_name,
        is_active,
        updated_at,
        last_active_at
    ) VALUES (
        p_user_id,
        p_user_email,
        p_player_id,
        p_device_type,
        p_device_name,
        TRUE,
        NOW(),
        NOW()
    )
    ON CONFLICT (onesignal_player_id) DO UPDATE
    SET 
        user_id = p_user_id,
        user_email = p_user_email,
        is_active = TRUE,
        updated_at = NOW(),
        last_active_at = NOW()
    RETURNING id INTO v_subscription_id;
    
    RETURN v_subscription_id;
END;
$$;

-- =====================================================
-- HELPER FUNCTION: Deactivate subscription
-- =====================================================

CREATE OR REPLACE FUNCTION deactivate_push_subscription(p_player_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE push_subscriptions
    SET is_active = FALSE, updated_at = NOW()
    WHERE onesignal_player_id = p_player_id;
    
    RETURN FOUND;
END;
$$;

-- Reload schema
NOTIFY pgrst, 'reload schema';

SELECT 'Push notification tables created successfully!' as status;

