
-- Add a simple policy that allows users to insert their own membership without accessing auth.users
CREATE POLICY "Allow invitation acceptance" 
ON public.company_members 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());
