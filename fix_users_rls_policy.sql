-- Fix RLS policy on users table to allow users to read their own record
-- This is needed because verifyMagicLink creates users with service_role key
-- but the frontend reads with user's own token

-- First, check if RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users';

-- Drop existing SELECT policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can read own record" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;

-- Create a new policy that allows users to read their own record
CREATE POLICY "Users can read own record" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Also ensure users can update their own record
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

CREATE POLICY "Users can update own record" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow service role and admin users to read all records
DROP POLICY IF EXISTS "Admin users can read all" ON users;

-- Allow company admins to read users in their company
DROP POLICY IF EXISTS "Company admins can read company users" ON users;
CREATE POLICY "Company admins can read company users" ON users
    FOR SELECT
    USING (
        auth.uid() = id 
        OR 
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.company_id = users.company_id 
            AND u.company_role IN ('admin', 'owner', 'manager')
        )
    );

-- Verify the policies
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'users';

