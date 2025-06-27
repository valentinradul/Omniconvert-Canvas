
-- Enable RLS on company_members table if not already enabled
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Allow users to view company members of companies they belong to
CREATE POLICY "Users can view company members of their companies" 
ON public.company_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.company_id = company_members.company_id 
    AND cm.user_id = auth.uid()
  )
);

-- Allow users to insert themselves as company members when accepting invitations
CREATE POLICY "Users can join companies with valid invitations" 
ON public.company_members 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.company_invitations ci 
    WHERE ci.company_id = company_members.company_id 
    AND ci.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND ci.accepted = false
  )
);

-- Allow company owners and admins to add new members
CREATE POLICY "Owners and admins can add company members" 
ON public.company_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.company_id = company_members.company_id 
    AND cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);

-- Allow company owners and admins to update member roles
CREATE POLICY "Owners and admins can update company members" 
ON public.company_members 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.company_id = company_members.company_id 
    AND cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);

-- Allow company owners and admins to remove members
CREATE POLICY "Owners and admins can remove company members" 
ON public.company_members 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.company_id = company_members.company_id 
    AND cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  )
);
