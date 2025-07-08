
-- Drop all existing problematic policies on company_members table
DROP POLICY IF EXISTS "Allow users to insert own membership" ON public.company_members;
DROP POLICY IF EXISTS "Allow authenticated users to view members" ON public.company_members;
DROP POLICY IF EXISTS "Allow users to manage own membership" ON public.company_members;
DROP POLICY IF EXISTS "Allow users to delete own membership" ON public.company_members;
DROP POLICY IF EXISTS "Allow invitation acceptance" ON public.company_members;
DROP POLICY IF EXISTS "Invitation insert for authenticated users only" ON public.company_members;
DROP POLICY IF EXISTS "Owners and admins can add company members" ON public.company_members;
DROP POLICY IF EXISTS "Owners and admins can remove company members" ON public.company_members;
DROP POLICY IF EXISTS "Owners and admins can update company members" ON public.company_members;
DROP POLICY IF EXISTS "Owners and managers can add members" ON public.company_members;
DROP POLICY IF EXISTS "Users can delete company members if admin" ON public.company_members;
DROP POLICY IF EXISTS "Users can insert company members if admin" ON public.company_members;
DROP POLICY IF EXISTS "Users can update company members if admin" ON public.company_members;
DROP POLICY IF EXISTS "Users can view members of their companies" ON public.company_members;
DROP POLICY IF EXISTS "Users can view their company members" ON public.company_members;
DROP POLICY IF EXISTS "Users can view their own company memberships" ON public.company_members;
DROP POLICY IF EXISTS "Authenticated users can view all company members" ON public.company_members;
DROP POLICY IF EXISTS "Super admins can manage all company members" ON public.company_members;

-- Create new simplified policies that don't cause recursion
-- Allow users to insert their own membership (for accepting invitations)
CREATE POLICY "Users can insert their own membership" 
ON public.company_members 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow all authenticated users to view company members
CREATE POLICY "Authenticated users can view company members" 
ON public.company_members 
FOR SELECT 
TO authenticated
USING (true);

-- Allow users to update/delete their own membership records
CREATE POLICY "Users can update their own membership" 
ON public.company_members 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own membership" 
ON public.company_members 
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

-- Allow company owners and admins to manage all members (using security definer function)
CREATE POLICY "Company admins can manage all members" 
ON public.company_members 
FOR ALL 
TO authenticated
USING (user_has_company_admin_role(auth.uid(), company_id))
WITH CHECK (user_has_company_admin_role(auth.uid(), company_id));

-- Allow super admins to manage all company members
CREATE POLICY "Super admins can manage all company members" 
ON public.company_members 
FOR ALL 
TO authenticated
USING (is_super_admin(auth.uid()));
