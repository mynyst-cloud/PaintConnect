-- ============================================
-- PaintConnect Role & Subscription Migration
-- ============================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS tier_features CASCADE;
DROP TABLE IF EXISTS tier_limits CASCADE;
DROP TABLE IF EXISTS subscription_tiers CASCADE;

-- ============================================
-- SUBSCRIPTION TIERS TABLE
-- ============================================
CREATE TABLE subscription_tiers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    trial_days INTEGER DEFAULT 0,
    is_trial BOOLEAN DEFAULT FALSE,
    max_users INTEGER DEFAULT 2,
    max_projects_per_month INTEGER DEFAULT 10, -- -1 voor onbeperkt
    max_materials INTEGER DEFAULT 50, -- -1 voor onbeperkt
    description TEXT,
    stripe_price_id VARCHAR(100),
    stripe_price_id_yearly VARCHAR(100),
    mollie_plan_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert subscription tiers
INSERT INTO subscription_tiers (id, name, display_name, price, trial_days, is_trial, max_users, max_projects_per_month, max_materials, description, sort_order) VALUES
    ('starter_trial', 'Starter (Trial)', 'Proefperiode', 0, 14, TRUE, 2, 10, 50, '14 dagen gratis proefperiode', 0),
    ('starter', 'Starter', 'Starter', 29, 0, FALSE, 2, 10, 50, 'Voor kleine zelfstandigen', 1),
    ('professional', 'Professional', 'Professional', 79, 0, FALSE, 5, 30, 150, 'Voor groeiende bedrijven', 2),
    ('enterprise', 'Enterprise', 'Enterprise', 199, 0, FALSE, 100, -1, -1, 'Voor grote organisaties', 3);

-- ============================================
-- TIER FEATURES TABLE
-- ============================================
CREATE TABLE tier_features (
    id SERIAL PRIMARY KEY,
    tier_id VARCHAR(50) NOT NULL REFERENCES subscription_tiers(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tier_id, feature_key)
);

-- ============================================
-- STARTER TRIAL FEATURES
-- ============================================
INSERT INTO tier_features (tier_id, feature_key, is_enabled) VALUES
    -- Dashboard
    ('starter_trial', 'page_dashboard', TRUE),
    ('starter_trial', 'dashboard_all_features', TRUE),
    -- Planning
    ('starter_trial', 'page_planning', TRUE),
    -- Projecten
    ('starter_trial', 'page_projects', TRUE),
    -- Beschadigingen
    ('starter_trial', 'page_damages', TRUE),
    -- Referrals
    ('starter_trial', 'page_referrals', TRUE),
    -- Materialen
    ('starter_trial', 'page_materials', TRUE),
    ('starter_trial', 'materials_request', TRUE),
    -- MateriaalBeheer
    ('starter_trial', 'page_materiaalbeheer', TRUE),
    ('starter_trial', 'materiaalbeheer_tab_materials', TRUE),
    ('starter_trial', 'materiaalbeheer_tab_invoices', FALSE),
    ('starter_trial', 'materiaalbeheer_tab_usage', FALSE),
    ('starter_trial', 'materiaalbeheer_add_manual', TRUE),
    ('starter_trial', 'materiaalbeheer_add_invoice', FALSE),
    -- VoorraadBeheer
    ('starter_trial', 'page_voorraad', FALSE),
    -- Verfcalculator
    ('starter_trial', 'page_verfcalculator', TRUE),
    -- Leads
    ('starter_trial', 'page_leads', TRUE),
    -- Team Activiteit
    ('starter_trial', 'page_team_activiteit', TRUE),
    ('starter_trial', 'checkin_features', TRUE),
    -- Subscription
    ('starter_trial', 'page_subscription', TRUE),
    -- Account Settings
    ('starter_trial', 'page_accountsettings', TRUE),
    ('starter_trial', 'accountsettings_show_email', FALSE),
    -- Klantportaal
    ('starter_trial', 'page_klantportaal', FALSE),
    ('starter_trial', 'invite_clients', FALSE),
    -- Analytics
    ('starter_trial', 'page_analytics', FALSE),
    -- API
    ('starter_trial', 'api_access', FALSE),
    -- Support
    ('starter_trial', 'support_email', TRUE),
    ('starter_trial', 'support_priority', FALSE),
    ('starter_trial', 'support_helpdesk', FALSE),
    ('starter_trial', 'personal_account_manager', FALSE);

-- ============================================
-- STARTER FEATURES
-- ============================================
INSERT INTO tier_features (tier_id, feature_key, is_enabled) VALUES
    ('starter', 'page_dashboard', TRUE),
    ('starter', 'dashboard_all_features', TRUE),
    ('starter', 'page_planning', TRUE),
    ('starter', 'page_projects', TRUE),
    ('starter', 'page_damages', TRUE),
    ('starter', 'page_referrals', TRUE),
    ('starter', 'page_materials', TRUE),
    ('starter', 'materials_request', TRUE),
    ('starter', 'page_materiaalbeheer', TRUE),
    ('starter', 'materiaalbeheer_tab_materials', TRUE),
    ('starter', 'materiaalbeheer_tab_invoices', FALSE),
    ('starter', 'materiaalbeheer_tab_usage', FALSE),
    ('starter', 'materiaalbeheer_add_manual', TRUE),
    ('starter', 'materiaalbeheer_add_invoice', FALSE),
    ('starter', 'page_voorraad', FALSE),
    ('starter', 'page_verfcalculator', TRUE),
    ('starter', 'page_leads', TRUE),
    ('starter', 'page_team_activiteit', TRUE),
    ('starter', 'checkin_features', TRUE),
    ('starter', 'page_subscription', TRUE),
    ('starter', 'page_accountsettings', TRUE),
    ('starter', 'accountsettings_show_email', FALSE),
    ('starter', 'page_klantportaal', FALSE),
    ('starter', 'invite_clients', FALSE),
    ('starter', 'page_analytics', FALSE),
    ('starter', 'api_access', FALSE),
    ('starter', 'support_email', TRUE),
    ('starter', 'support_priority', FALSE),
    ('starter', 'support_helpdesk', FALSE),
    ('starter', 'personal_account_manager', FALSE);

-- ============================================
-- PROFESSIONAL FEATURES
-- ============================================
INSERT INTO tier_features (tier_id, feature_key, is_enabled) VALUES
    ('professional', 'page_dashboard', TRUE),
    ('professional', 'dashboard_all_features', TRUE),
    ('professional', 'page_planning', TRUE),
    ('professional', 'page_projects', TRUE),
    ('professional', 'page_damages', TRUE),
    ('professional', 'page_referrals', TRUE),
    ('professional', 'page_materials', TRUE),
    ('professional', 'materials_request', TRUE),
    ('professional', 'page_materiaalbeheer', TRUE),
    ('professional', 'materiaalbeheer_tab_materials', TRUE),
    ('professional', 'materiaalbeheer_tab_invoices', TRUE),
    ('professional', 'materiaalbeheer_tab_usage', TRUE),
    ('professional', 'materiaalbeheer_add_manual', TRUE),
    ('professional', 'materiaalbeheer_add_invoice', TRUE),
    ('professional', 'page_voorraad', TRUE),
    ('professional', 'page_verfcalculator', TRUE),
    ('professional', 'page_leads', TRUE),
    ('professional', 'page_team_activiteit', TRUE),
    ('professional', 'checkin_features', TRUE),
    ('professional', 'page_subscription', TRUE),
    ('professional', 'page_accountsettings', TRUE),
    ('professional', 'accountsettings_show_email', TRUE),
    ('professional', 'page_klantportaal', TRUE),
    ('professional', 'invite_clients', TRUE),
    ('professional', 'page_analytics', TRUE),
    ('professional', 'api_access', FALSE),
    ('professional', 'support_email', TRUE),
    ('professional', 'support_priority', TRUE),
    ('professional', 'support_helpdesk', TRUE),
    ('professional', 'personal_account_manager', FALSE);

-- ============================================
-- ENTERPRISE FEATURES
-- ============================================
INSERT INTO tier_features (tier_id, feature_key, is_enabled) VALUES
    ('enterprise', 'page_dashboard', TRUE),
    ('enterprise', 'dashboard_all_features', TRUE),
    ('enterprise', 'page_planning', TRUE),
    ('enterprise', 'page_projects', TRUE),
    ('enterprise', 'page_damages', TRUE),
    ('enterprise', 'page_referrals', TRUE),
    ('enterprise', 'page_materials', TRUE),
    ('enterprise', 'materials_request', TRUE),
    ('enterprise', 'page_materiaalbeheer', TRUE),
    ('enterprise', 'materiaalbeheer_tab_materials', TRUE),
    ('enterprise', 'materiaalbeheer_tab_invoices', TRUE),
    ('enterprise', 'materiaalbeheer_tab_usage', TRUE),
    ('enterprise', 'materiaalbeheer_add_manual', TRUE),
    ('enterprise', 'materiaalbeheer_add_invoice', TRUE),
    ('enterprise', 'page_voorraad', TRUE),
    ('enterprise', 'page_verfcalculator', TRUE),
    ('enterprise', 'page_leads', TRUE),
    ('enterprise', 'page_team_activiteit', TRUE),
    ('enterprise', 'checkin_features', TRUE),
    ('enterprise', 'page_subscription', TRUE),
    ('enterprise', 'page_accountsettings', TRUE),
    ('enterprise', 'accountsettings_show_email', TRUE),
    ('enterprise', 'page_klantportaal', TRUE),
    ('enterprise', 'invite_clients', TRUE),
    ('enterprise', 'page_analytics', TRUE),
    ('enterprise', 'api_access', TRUE),
    ('enterprise', 'support_email', TRUE),
    ('enterprise', 'support_priority', TRUE),
    ('enterprise', 'support_helpdesk', TRUE),
    ('enterprise', 'personal_account_manager', TRUE);

-- ============================================
-- TIER LIMITS TABLE
-- ============================================
CREATE TABLE tier_limits (
    id SERIAL PRIMARY KEY,
    tier_id VARCHAR(50) NOT NULL REFERENCES subscription_tiers(id) ON DELETE CASCADE,
    limit_key VARCHAR(100) NOT NULL,
    limit_value INTEGER NOT NULL, -- -1 voor onbeperkt
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tier_id, limit_key)
);

-- Insert limits for all tiers
INSERT INTO tier_limits (tier_id, limit_key, limit_value) VALUES
    -- Starter Trial
    ('starter_trial', 'max_users', 2),
    ('starter_trial', 'max_projects_per_month', 10),
    ('starter_trial', 'max_materials', 50),
    ('starter_trial', 'max_storage_gb', 1),
    -- Starter
    ('starter', 'max_users', 2),
    ('starter', 'max_projects_per_month', 10),
    ('starter', 'max_materials', 50),
    ('starter', 'max_storage_gb', 5),
    -- Professional
    ('professional', 'max_users', 5),
    ('professional', 'max_projects_per_month', 30),
    ('professional', 'max_materials', 150),
    ('professional', 'max_storage_gb', 25),
    -- Enterprise
    ('enterprise', 'max_users', 100),
    ('enterprise', 'max_projects_per_month', -1),
    ('enterprise', 'max_materials', -1),
    ('enterprise', 'max_storage_gb', -1);

-- ============================================
-- UPDATE COMPANIES TABLE
-- ============================================
-- Add columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'subscription_tier') THEN
        ALTER TABLE companies ADD COLUMN subscription_tier VARCHAR(50) DEFAULT 'starter_trial' REFERENCES subscription_tiers(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'trial_started_at') THEN
        ALTER TABLE companies ADD COLUMN trial_started_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'trial_ends_at') THEN
        ALTER TABLE companies ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'subscription_started_at') THEN
        ALTER TABLE companies ADD COLUMN subscription_started_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'subscription_ends_at') THEN
        ALTER TABLE companies ADD COLUMN subscription_ends_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================
-- UPDATE USERS TABLE FOR ROLES
-- ============================================
-- Ensure role column exists with proper values
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'company_role') THEN
        ALTER TABLE users ADD COLUMN company_role VARCHAR(50) DEFAULT 'painter';
    END IF;
END $$;

-- Update existing company_role values to be consistent
UPDATE users SET company_role = 'admin' WHERE company_role IN ('owner', 'Admin', 'ADMIN');
UPDATE users SET company_role = 'painter' WHERE company_role IN ('Painter', 'PAINTER', 'schilder');
UPDATE users SET company_role = 'super_admin' WHERE company_role IN ('SuperAdmin', 'SUPER_ADMIN', 'superadmin');

-- ============================================
-- CREATE INDEX FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tier_features_tier_id ON tier_features(tier_id);
CREATE INDEX IF NOT EXISTS idx_tier_limits_tier_id ON tier_limits(tier_id);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_tier ON companies(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_role);

-- ============================================
-- TRIGGER TO UPDATE UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_subscription_tiers_updated_at ON subscription_tiers;
CREATE TRIGGER update_subscription_tiers_updated_at
    BEFORE UPDATE ON subscription_tiers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


