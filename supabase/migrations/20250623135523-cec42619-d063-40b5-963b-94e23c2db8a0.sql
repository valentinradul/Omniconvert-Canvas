
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view invitations for their companies" ON public.company_invitations;
DROP POLICY IF EXISTS "Owners and admins can create invitations" ON public.company_invitations;
DROP POLICY IF EXISTS "Owners and admins can update invitations" ON public.company_invitations;
DROP POLICY IF EXISTS "Owners and admins can delete invitations" ON public.company_invitations;

-- Enable RLS on company_invitations table (if not already enabled)
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;

-- Allow users to see invitations for companies they are members of
CREATE POLICY "Users can view invitations for their companies" 
  ON public.company_invitations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members
      WHERE company_members.company_id = company_invitations.company_id
      AND company_members.user_id = auth.uid()
      AND company_members.role IN ('owner', 'admin')
    )
  );

-- Allow owners and admins to insert invitations
CREATE POLICY "Owners and admins can create invitations" 
  ON public.company_invitations 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_members
      WHERE company_members.company_id = company_invitations.company_id
      AND company_members.user_id = auth.uid()
      AND company_members.role IN ('owner', 'admin')
    )
  );

-- Allow owners and admins to update invitations (for acceptance)
CREATE POLICY "Owners and admins can update invitations" 
  ON public.company_invitations 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members
      WHERE company_members.company_id = company_invitations.company_id
      AND company_members.user_id = auth.uid()
      AND company_members.role IN ('owner', 'admin')
    )
  );

-- Allow owners and admins to delete invitations
CREATE POLICY "Owners and admins can delete invitations" 
  ON public.company_invitations 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members
      WHERE company_members.company_id = company_invitations.company_id
      AND company_members.user_id = auth.uid()
      AND company_members.role IN ('owner', 'admin')
    )
  );
