
-- Check current RLS policies on all company-related tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('companies', 'company_members', 'company_invitations')
ORDER BY tablename, policyname;

-- Temporarily check data without RLS restrictions (as superuser)
SET row_security = off;

-- Check if companies actually exist
SELECT id, name, created_by, created_at FROM public.companies;

-- Check if company_members exist
SELECT id, company_id, user_id, role, created_at FROM public.company_members;

-- Check if company_invitations exist
SELECT id, company_id, email, role, accepted, created_at FROM public.company_invitations;

-- Reset row security
SET row_security = on;

-- Fix RLS policies for better data visibility
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view companies they are members of" ON public.companies;
DROP POLICY IF EXISTS "Users can view company members of their companies" ON public.company_members;
DROP POLICY IF EXISTS "Users can view invitations for their companies" ON public.company_invitations;
DROP POLICY IF EXISTS "Users can view their own invitations" ON public.company_invitations;

-- Create more permissive policies for authenticated users
CREATE POLICY "Authenticated users can view all companies" 
ON public.companies 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view all company members" 
ON public.company_members 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view all company invitations" 
ON public.company_invitations 
FOR SELECT 
TO authenticated
USING (true);
