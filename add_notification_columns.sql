-- Add missing columns to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS link_to TEXT,
ADD COLUMN IF NOT EXISTS triggering_user_name TEXT,
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have created_at from created_date
UPDATE notifications 
SET created_at = created_date 
WHERE created_at IS NULL AND created_date IS NOT NULL;

