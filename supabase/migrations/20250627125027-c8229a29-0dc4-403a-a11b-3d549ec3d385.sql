
-- Drop all existing policies for company_invitations table
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON public.company_invitations;
DROP POLICY IF EXISTS "Users can update invitations sent to their email" ON public.company_invitations;
DROP POLICY IF EXISTS "Company admins can view company invitations" ON public.company_invitations;
DROP POLICY IF EXISTS "Company admins can manage company invitations" ON public.company_invitations;
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON public.company_invitations;
DROP POLICY IF EXISTS "Users can update invitations sent to them" ON public.company_invitations;

-- Create a security definer function to get current user's email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create new policies using the security definer function
CREATE POLICY "Users can view invitations for their email" 
ON public.company_invitations 
FOR SELECT 
USING (email = public.get_current_user_email());

CREATE POLICY "Users can update invitations for their email" 
ON public.company_invitations 
FOR UPDATE 
USING (email = public.get_current_user_email());

-- Allow company admins to manage invitations
CREATE POLICY "Company admins can view all company invitations" 
ON public.company_invitations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.company_id = company_invitations.company_id 
    AND cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Company admins can manage all company invitations" 
ON public.company_invitations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.company_id = company_invitations.company_id 
    AND cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);
