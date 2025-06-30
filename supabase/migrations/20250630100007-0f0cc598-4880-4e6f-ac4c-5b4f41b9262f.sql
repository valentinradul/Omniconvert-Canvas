
-- Drop ALL existing policies on company_members table
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.company_members;
DROP POLICY IF EXISTS "Authenticated users can view company members" ON public.company_members;
DROP POLICY IF EXISTS "Users can manage their own membership" ON public.company_members;
DROP POLICY IF EXISTS "Users can view company members" ON public.company_members;
DROP POLICY IF EXISTS "Company admins can manage members" ON public.company_members;
DROP POLICY IF EXISTS "Users can insert their own company membership" ON public.company_members;
DROP POLICY IF EXISTS "Users can view company members of their companies" ON public.company_members;

-- Create new policies with unique names
CREATE POLICY "Allow users to insert own membership" 
ON public.company_members 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow all authenticated users to view company members (filtering done in app)
CREATE POLICY "Allow authenticated users to view members" 
ON public.company_members 
FOR SELECT 
TO authenticated
USING (true);

-- Allow users to update/delete only their own membership records
CREATE POLICY "Allow users to manage own membership" 
ON public.company_members 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Allow users to delete own membership" 
ON public.company_members 
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());
