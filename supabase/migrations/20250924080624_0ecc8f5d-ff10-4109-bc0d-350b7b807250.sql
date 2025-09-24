-- Remove the overly permissive policy that allows any authenticated user to view all companies
DROP POLICY IF EXISTS "Authenticated users can view all companies" ON public.companies;

-- The following existing policies will handle proper access control:
-- 1. "Users can view companies they belong to" - allows access via company membership
-- 2. "Users can view their companies" - allows access for company members  
-- 3. "Super admins can manage all companies" - allows super admin access
-- 4. Company owners and admins policies for management

-- Verify remaining policies provide proper access control without exposing all companies