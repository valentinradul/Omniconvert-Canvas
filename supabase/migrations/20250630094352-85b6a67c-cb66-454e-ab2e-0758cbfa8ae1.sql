
-- Drop all existing policies on company_members that are causing recursion
DROP POLICY IF EXISTS "Users can view company members" ON public.company_members;
DROP POLICY IF EXISTS "Company admins can manage members" ON public.company_members;
DROP POLICY IF EXISTS "Users can insert their own company membership" ON public.company_members;

-- Create simple, non-recursive policies
CREATE POLICY "Users can insert their own membership" 
ON public.company_members 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow all authenticated users to view company members (we'll filter in application code)
CREATE POLICY "Authenticated users can view company members" 
ON public.company_members 
FOR SELECT 
TO authenticated
USING (true);

-- Allow users to update/delete only their own membership records
CREATE POLICY "Users can manage their own membership" 
ON public.company_members 
FOR ALL 
TO authenticated
USING (user_id = auth.uid());
