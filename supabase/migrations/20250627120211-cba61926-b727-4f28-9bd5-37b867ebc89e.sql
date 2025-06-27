
-- First, drop the existing policies that are causing recursion
DROP POLICY IF EXISTS "Users can view company members of their companies" ON public.company_members;
DROP POLICY IF EXISTS "Users can join companies with valid invitations" ON public.company_members;
DROP POLICY IF EXISTS "Owners and admins can add company members" ON public.company_members;
DROP POLICY IF EXISTS "Owners and admins can update company members" ON public.company_members;
DROP POLICY IF EXISTS "Owners and admins can remove company members" ON public.company_members;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.user_is_company_member(user_id uuid, company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.user_id = user_is_company_member.user_id 
    AND cm.company_id = user_is_company_member.company_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.user_has_company_admin_role(user_id uuid, company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.user_id = user_has_company_admin_role.user_id 
    AND cm.company_id = user_has_company_admin_role.company_id
    AND cm.role IN ('owner', 'admin')
  );
END;
$$;

-- Create new policies using the security definer functions
CREATE POLICY "Users can view company members of their companies" 
ON public.company_members 
FOR SELECT 
USING (public.user_is_company_member(auth.uid(), company_id));

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

CREATE POLICY "Owners and admins can add company members" 
ON public.company_members 
FOR INSERT 
WITH CHECK (public.user_has_company_admin_role(auth.uid(), company_id));

CREATE POLICY "Owners and admins can update company members" 
ON public.company_members 
FOR UPDATE 
USING (public.user_has_company_admin_role(auth.uid(), company_id));

CREATE POLICY "Owners and admins can remove company members" 
ON public.company_members 
FOR DELETE 
USING (public.user_has_company_admin_role(auth.uid(), company_id));
