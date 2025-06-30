
-- Enable RLS on tables (these are safe to run multiple times)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view companies they are members of" ON public.companies;
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view company members of their companies" ON public.company_members;
DROP POLICY IF EXISTS "Users can view invitations for their companies" ON public.company_invitations;
DROP POLICY IF EXISTS "Users can view their own invitations" ON public.company_invitations;

-- Create policies for companies table
CREATE POLICY "Users can view companies they are members of" 
ON public.companies 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.company_id = companies.id 
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create companies" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Create policies for company_members table
CREATE POLICY "Users can view company members of their companies" 
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

-- Create policies for company_invitations table
CREATE POLICY "Users can view invitations for their companies" 
ON public.company_invitations 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.company_id = company_invitations.company_id 
    AND cm.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can view their own invitations" 
ON public.company_invitations 
FOR SELECT 
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
