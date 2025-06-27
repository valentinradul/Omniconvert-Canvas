
-- Update the RLS policy to remove the email check that requires access to auth.users
DROP POLICY IF EXISTS "Users can join companies with valid invitations" ON public.company_members;

-- Create a simpler policy that just allows users to add themselves
-- We'll rely on application logic to ensure they have a valid invitation
CREATE POLICY "Users can join companies with valid invitations" 
ON public.company_members 
FOR INSERT 
WITH CHECK (user_id = auth.uid());
