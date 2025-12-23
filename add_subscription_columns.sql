-- =====================================================
-- SQL script to add subscription-related columns to companies table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add Mollie customer/subscription columns
ALTER TABLE companies ADD COLUMN IF NOT EXISTS mollie_customer_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS mollie_subscription_id TEXT;

-- Add Stripe customer/subscription columns
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add subscription management columns
ALTER TABLE companies ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly'; -- 'monthly' or 'yearly'
ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pending_subscription JSONB; -- Stores pending subscription info during checkout

-- Add subscription status if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE companies ADD COLUMN subscription_status TEXT DEFAULT 'trialing';
  END IF;
END $$;

-- Add subscription tier if not exists  
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE companies ADD COLUMN subscription_tier TEXT DEFAULT 'starter_trial';
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_mollie_customer ON companies(mollie_customer_id) WHERE mollie_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_stripe_customer ON companies(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_stripe_subscription ON companies(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_mollie_subscription ON companies(mollie_subscription_id) WHERE mollie_subscription_id IS NOT NULL;

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND column_name IN (
  'mollie_customer_id', 'mollie_subscription_id',
  'stripe_customer_id', 'stripe_subscription_id',
  'billing_cycle', 'last_payment_date', 'next_billing_date',
  'pending_subscription', 'subscription_status', 'subscription_tier'
)
ORDER BY column_name;

