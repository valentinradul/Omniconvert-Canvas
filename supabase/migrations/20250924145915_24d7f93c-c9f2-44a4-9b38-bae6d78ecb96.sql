-- Remove overly permissive policies that allow any authenticated user to manipulate company invitations
DROP POLICY IF EXISTS "Authenticated users can delete invitations" ON public.company_invitations;
DROP POLICY IF EXISTS "Authenticated users can view invitations" ON public.company_invitations;