-- Add missing columns to supplier_invoices table
-- Run this in your Supabase SQL Editor

-- Add email-related columns
ALTER TABLE supplier_invoices 
ADD COLUMN IF NOT EXISTS email_subject TEXT,
ADD COLUMN IF NOT EXISTS email_body_html TEXT,
ADD COLUMN IF NOT EXISTS email_body_text TEXT;

-- Add line_items column (JSONB for storing invoice line items)
ALTER TABLE supplier_invoices 
ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN supplier_invoices.email_subject IS 'Subject of the email that contained the invoice';
COMMENT ON COLUMN supplier_invoices.email_body_html IS 'HTML body of the email that contained the invoice';
COMMENT ON COLUMN supplier_invoices.email_body_text IS 'Plain text body of the email that contained the invoice';
COMMENT ON COLUMN supplier_invoices.line_items IS 'Array of invoice line items (materials, prices, quantities) in JSON format';



