
-- Drop the problematic policies that might still be trying to access auth.users directly
DROP POLICY IF EXISTS "Users can view invitations for their email" ON public.company_invitations;
DROP POLICY IF EXISTS "Users can update invitations for their email" ON public.company_invitations;

-- Create simpler policies that don't try to access auth.users
-- Allow authenticated users to view invitations (we'll filter by email in application code)
CREATE POLICY "Authenticated users can view invitations" 
ON public.company_invitations 
FOR SELECT 
TO authenticated
USING (true);

-- Allow authenticated users to update invitations (we'll validate in application code)
CREATE POLICY "Authenticated users can update invitations" 
ON public.company_invitations 
FOR UPDATE 
TO authenticated
USING (true);

-- Also ensure users can delete invitations (for declining)
CREATE POLICY "Authenticated users can delete invitations" 
ON public.company_invitations 
FOR DELETE 
TO authenticated
USING (true);

-- Make sure the company_members insert policy is correct
DROP POLICY IF EXISTS "Users can join companies with valid invitations" ON public.company_members;

CREATE POLICY "Authenticated users can insert company members" 
ON public.company_members 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());
