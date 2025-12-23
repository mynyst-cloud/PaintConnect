-- Add subscription_invoices table for storing payment invoices
-- Run this in Supabase SQL Editor

-- Create subscription_invoices table
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Mollie/Stripe references
  mollie_invoice_id TEXT,
  mollie_payment_id TEXT,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  payment_provider TEXT DEFAULT 'mollie', -- 'mollie' or 'stripe'
  
  -- Invoice details
  invoice_number TEXT,
  invoice_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  
  -- Amounts
  amount DECIMAL(10,2) NOT NULL,
  amount_due DECIMAL(10,2) NOT NULL,
  vat_amount DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  
  -- Subscription info
  subscription_tier TEXT,
  billing_cycle TEXT, -- 'monthly' or 'yearly'
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  
  -- Description and metadata
  description TEXT,
  line_items JSONB DEFAULT '[]'::jsonb,
  
  -- URLs
  pdf_url TEXT,
  hosted_invoice_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'paid', -- paid, pending, open, void, uncollectible
  payment_method TEXT, -- 'ideal', 'creditcard', etc.
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_company ON subscription_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_date ON subscription_invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON subscription_invoices(status);

-- Enable RLS
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own company's invoices
CREATE POLICY "Users can view own company invoices"
ON subscription_invoices FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Service role can insert/update (for webhooks)
CREATE POLICY "Service role can manage invoices"
ON subscription_invoices FOR ALL
USING (auth.role() = 'service_role');

-- Add billing_email column to companies if not exists
ALTER TABLE companies ADD COLUMN IF NOT EXISTS billing_email TEXT;

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_subscription_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS subscription_invoices_updated_at ON subscription_invoices;
CREATE TRIGGER subscription_invoices_updated_at
  BEFORE UPDATE ON subscription_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_invoices_updated_at();

-- Grant permissions
GRANT SELECT ON subscription_invoices TO authenticated;
GRANT ALL ON subscription_invoices TO service_role;

