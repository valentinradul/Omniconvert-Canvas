-- Drop existing problematic policies on team_members
DROP POLICY IF EXISTS "Team members can view other members in their teams" ON public.team_members;
DROP POLICY IF EXISTS "Team owners and admins can add team members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners and admins can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can delete team members" ON public.team_members;
DROP POLICY IF EXISTS "Allow insert if user has invitation" ON public.team_members;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.user_is_team_member(team_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_id_param 
    AND tm.user_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.user_is_team_admin_or_owner(team_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_id_param 
    AND tm.user_id = auth.uid()
    AND tm.role IN ('owner', 'admin')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.user_is_team_owner(team_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_id_param 
    AND tm.user_id = auth.uid()
    AND tm.role = 'owner'
  );
END;
$$;

-- Create new policies using the security definer functions
CREATE POLICY "Team members can view other members in their teams" 
ON public.team_members 
FOR SELECT 
USING (user_is_team_member(team_id));

CREATE POLICY "Team owners and admins can add team members" 
ON public.team_members 
FOR INSERT 
WITH CHECK (user_is_team_admin_or_owner(team_id));

CREATE POLICY "Team owners and admins can update team members" 
ON public.team_members 
FOR UPDATE 
USING (user_is_team_admin_or_owner(team_id));

CREATE POLICY "Team owners can delete team members" 
ON public.team_members 
FOR DELETE 
USING (user_is_team_owner(team_id));

CREATE POLICY "Allow insert if user has invitation" 
ON public.team_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_invitations
    WHERE email = auth.email() AND accepted = false
  )
);