
-- Drop existing problematic policies on company_members table
DROP POLICY IF EXISTS "Authenticated users can insert company members" ON public.company_members;
DROP POLICY IF EXISTS "Users can join companies with valid invitations" ON public.company_members;

-- Create a simple policy that allows authenticated users to insert their own membership
CREATE POLICY "Users can insert their own company membership" 
ON public.company_members 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to view company members of companies they belong to
CREATE POLICY "Users can view company members" 
ON public.company_members 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.company_id = company_members.company_id 
    AND cm.user_id = auth.uid()
  )
);

-- Allow company admins to update and delete members
CREATE POLICY "Company admins can manage members" 
ON public.company_members 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.company_id = company_members.company_id 
    AND cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);
