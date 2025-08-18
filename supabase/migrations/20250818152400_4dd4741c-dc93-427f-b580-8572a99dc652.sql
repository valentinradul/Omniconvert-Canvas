-- Restrict profiles visibility to own, same company/team, or super admins
-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive public read policy if it exists
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow company members to view profiles of users in the same company
CREATE POLICY "Company members can view same company profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.company_members cm_self
    JOIN public.company_members cm_target ON cm_self.company_id = cm_target.company_id
    WHERE cm_self.user_id = auth.uid()
      AND cm_target.user_id = public.profiles.id
  )
);

-- Allow team members to view profiles of users in the same team
CREATE POLICY "Team members can view same team profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm_self
    JOIN public.team_members tm_target ON tm_self.team_id = tm_target.team_id
    WHERE tm_self.user_id = auth.uid()
      AND tm_target.user_id = public.profiles.id
  )
);

-- Allow super admins to view all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_super_admin(auth.uid()));