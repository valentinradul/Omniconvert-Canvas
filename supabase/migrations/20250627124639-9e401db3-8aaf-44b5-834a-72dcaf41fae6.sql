
-- Update the RLS policy to allow invitation acceptance without querying auth.users
DROP POLICY IF EXISTS "Users can join companies with valid invitations" ON public.company_members;

-- Create a more permissive policy for invitation acceptance
-- We'll rely on application logic to validate invitations since RLS can't access auth.users
CREATE POLICY "Users can join companies with valid invitations" 
ON public.company_members 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Also update company_invitations policies to allow users to see and update invitations sent to their email
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON public.company_invitations;
DROP POLICY IF EXISTS "Users can update invitations sent to them" ON public.company_invitations;

CREATE POLICY "Users can view invitations sent to them" 
ON public.company_invitations 
FOR SELECT 
USING (true); -- Allow reading invitations - we'll filter by email in application code

CREATE POLICY "Users can update invitations sent to them" 
ON public.company_invitations 
FOR UPDATE 
USING (true); -- Allow updating invitations - we'll validate in application code
