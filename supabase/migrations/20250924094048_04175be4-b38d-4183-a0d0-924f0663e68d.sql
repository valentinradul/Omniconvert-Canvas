-- Remove the overly permissive policy that allows any authenticated user to view all company members
DROP POLICY IF EXISTS "Authenticated users can view company members" ON public.company_members;

-- Add a proper policy that only allows users to view members of companies they belong to
CREATE POLICY "Users can view members of their companies only" 
ON public.company_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm_check
    WHERE cm_check.company_id = company_members.company_id 
    AND cm_check.user_id = auth.uid()
  )
);

-- The following existing policies will continue to provide proper access control:
-- 1. "Company admins can manage all members" - for admin functions
-- 2. "Super admins can manage all company members" - for super admin access  
-- 3. "Users can insert/update/delete their own membership" - for self-management

-- This ensures users can only see members of companies they actually belong to