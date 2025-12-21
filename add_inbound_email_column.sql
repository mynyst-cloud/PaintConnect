-- Add missing columns to companies table
-- Run this in your Supabase SQL Editor

-- Add inbound_email_address column
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS inbound_email_address TEXT;

-- Add address-related columns (if they don't exist)
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS house_number TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add phone_number column if it doesn't exist (AccountSettings uses phone_number, but registerCompany uses phone)
-- Note: You might need to migrate data from 'phone' to 'phone_number' if both exist
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Note: The 'address' column might already exist and is used in registerCompany
-- If you want to keep using 'address' instead of separate fields, you can skip the above
-- and just add inbound_email_address

-- Add comments for documentation
COMMENT ON COLUMN companies.inbound_email_address IS 'Unique email address for receiving invoices from suppliers (format: {bedrijfsnaam}{2 random cijfers}@facturatie.paintconnect.be)';
COMMENT ON COLUMN companies.street IS 'Street name for company address';
COMMENT ON COLUMN companies.house_number IS 'House number for company address';
COMMENT ON COLUMN companies.postal_code IS 'Postal code for company address';
COMMENT ON COLUMN companies.city IS 'City for company address';




