-- =====================================================
-- FIX: Link inbound email address to existing company
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, check current state of your company's inbound email
SELECT id, name, inbound_email_address 
FROM companies 
WHERE name ILIKE '%freshdecor%' OR name ILIKE '%fresh decor%';

-- If inbound_email_address is NULL, run this to set it:
UPDATE companies 
SET inbound_email_address = 'freshdecorbv69@facturatie.paintconnect.be'
WHERE name ILIKE '%freshdecor%' 
  AND (inbound_email_address IS NULL OR inbound_email_address = '');

-- Verify the update worked:
SELECT id, name, inbound_email_address 
FROM companies 
WHERE inbound_email_address = 'freshdecorbv69@facturatie.paintconnect.be';

-- =====================================================
-- ALTERNATIVE: If you know your company_id, use this:
-- =====================================================
-- UPDATE companies 
-- SET inbound_email_address = 'freshdecorbv69@facturatie.paintconnect.be'
-- WHERE id = 'YOUR-COMPANY-ID-HERE';

