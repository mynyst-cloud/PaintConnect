-- =============================================
-- Fix daily_update_interactions table
-- Run this in Supabase SQL Editor
-- =============================================

-- Add missing columns to daily_update_interactions
ALTER TABLE daily_update_interactions 
ADD COLUMN IF NOT EXISTS actor_email TEXT,
ADD COLUMN IF NOT EXISTS actor_name TEXT,
ADD COLUMN IF NOT EXISTS actor_type TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS interaction_type TEXT DEFAULT 'comment',
ADD COLUMN IF NOT EXISTS comment_text TEXT,
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

-- Verify the columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'daily_update_interactions'
ORDER BY ordinal_position;

