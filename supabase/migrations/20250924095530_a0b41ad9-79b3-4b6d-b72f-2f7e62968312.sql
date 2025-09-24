-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view members of their companies only" ON public.company_members;

-- Create new policy using the security definer function to avoid recursion
CREATE POLICY "Users can view members of their companies only"
ON public.company_members
FOR SELECT
USING (
  user_is_company_member(auth.uid(), company_id)
);