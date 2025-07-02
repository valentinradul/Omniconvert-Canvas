
-- Clean up only the overly permissive RLS policies on company_invitations table
DROP POLICY IF EXISTS "Authenticated users can delete invitations" ON public.company_invitations;
DROP POLICY IF EXISTS "Authenticated users can update invitations" ON public.company_invitations;
DROP POLICY IF EXISTS "Authenticated users can view all company invitations" ON public.company_invitations;
DROP POLICY IF EXISTS "Authenticated users can view invitations" ON public.company_invitations;

-- Keep the existing specific policies for company_invitations
-- The remaining policies like "Users can view their invitations", "Company admins can manage all company invitations", etc. will remain unchanged
