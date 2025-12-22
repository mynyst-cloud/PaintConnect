-- =====================================================
-- INVOICE PROCESSING - DATABASE MIGRATION
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Add new columns to supplier_invoices table for enhanced processing
ALTER TABLE supplier_invoices
ADD COLUMN IF NOT EXISTS supplier_email TEXT,
ADD COLUMN IF NOT EXISTS supplier_address TEXT,
ADD COLUMN IF NOT EXISTS supplier_vat_number TEXT,
ADD COLUMN IF NOT EXISTS supplier_iban TEXT,
ADD COLUMN IF NOT EXISTS supplier_bic TEXT,
ADD COLUMN IF NOT EXISTS reference TEXT,
ADD COLUMN IF NOT EXISTS subtotal_excl_vat DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS discount_total DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS original_email_subject TEXT,
ADD COLUMN IF NOT EXISTS original_email_from TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS structured_reference TEXT,
ADD COLUMN IF NOT EXISTS ocr_raw_text TEXT;

-- Add comments for documentation
COMMENT ON COLUMN supplier_invoices.supplier_email IS 'Email address of the supplier';
COMMENT ON COLUMN supplier_invoices.supplier_address IS 'Full address of the supplier';
COMMENT ON COLUMN supplier_invoices.supplier_vat_number IS 'VAT number of the supplier';
COMMENT ON COLUMN supplier_invoices.supplier_iban IS 'Bank account IBAN of the supplier';
COMMENT ON COLUMN supplier_invoices.supplier_bic IS 'Bank BIC code of the supplier';
COMMENT ON COLUMN supplier_invoices.reference IS 'Reference or PO number';
COMMENT ON COLUMN supplier_invoices.subtotal_excl_vat IS 'Subtotal excluding VAT';
COMMENT ON COLUMN supplier_invoices.vat_amount IS 'Total VAT amount';
COMMENT ON COLUMN supplier_invoices.discount_total IS 'Total discount amount';
COMMENT ON COLUMN supplier_invoices.confidence_score IS 'AI confidence score 0-1';
COMMENT ON COLUMN supplier_invoices.source IS 'Source of invoice: manual, email_inbound, api';
COMMENT ON COLUMN supplier_invoices.original_email_subject IS 'Original email subject if from inbound';
COMMENT ON COLUMN supplier_invoices.original_email_from IS 'Original sender email if from inbound';
COMMENT ON COLUMN supplier_invoices.payment_method IS 'Payment method: overschrijving, bancontact, etc';
COMMENT ON COLUMN supplier_invoices.structured_reference IS 'Belgian structured payment reference +++XXX/XXXX/XXXXX+++';
COMMENT ON COLUMN supplier_invoices.ocr_raw_text IS 'Raw OCR text for debugging (first 10k chars)';

-- Add new columns to suppliers table for enhanced data
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS bic TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create storage bucket for supplier invoices (run via Supabase dashboard or API)
-- Note: This needs to be done via the Supabase dashboard or storage API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('supplier-invoices', 'supplier-invoices', false)
-- ON CONFLICT DO NOTHING;

-- Create RLS policy for supplier_invoices
-- Users can only see invoices from their company
DROP POLICY IF EXISTS "Users can view company invoices" ON supplier_invoices;
CREATE POLICY "Users can view company invoices" ON supplier_invoices
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert company invoices" ON supplier_invoices;
CREATE POLICY "Users can insert company invoices" ON supplier_invoices
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update company invoices" ON supplier_invoices;
CREATE POLICY "Users can update company invoices" ON supplier_invoices
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete company invoices" ON supplier_invoices;
CREATE POLICY "Users can delete company invoices" ON supplier_invoices
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Enable RLS on supplier_invoices if not already
ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;

-- Add index for faster queries by company and status
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_company_status 
ON supplier_invoices(company_id, status);

CREATE INDEX IF NOT EXISTS idx_supplier_invoices_source 
ON supplier_invoices(source);

-- Add 'invoice_received' to notification types if needed
-- (No schema change needed, just documentation)
-- Notification types: invoice_received, material_requested, damage_reported, etc.

SELECT 'Migration completed successfully!' AS result;

