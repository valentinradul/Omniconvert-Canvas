
-- Create a function to find orphaned invitations
-- These are invitations where:
-- 1. accepted = false
-- 2. A user with that email exists in auth.users
-- 3. That user is NOT in company_members for that company
CREATE OR REPLACE FUNCTION public.get_orphaned_invitations()
RETURNS TABLE (
  invitation_id uuid,
  email text,
  role text,
  company_id uuid,
  company_name text,
  user_id uuid,
  user_name text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if user is super admin
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;

  RETURN QUERY
  SELECT 
    ci.id as invitation_id,
    ci.email,
    ci.role,
    ci.company_id,
    c.name as company_name,
    au.id as user_id,
    p.full_name as user_name,
    ci.created_at
  FROM public.company_invitations ci
  JOIN public.companies c ON ci.company_id = c.id
  JOIN auth.users au ON LOWER(au.email) = LOWER(ci.email)
  JOIN public.profiles p ON p.id = au.id
  WHERE ci.accepted = false
  AND NOT EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.user_id = au.id 
    AND cm.company_id = ci.company_id
  )
  ORDER BY ci.created_at DESC;
END;
$$;

-- Create a function to fix a single orphaned invitation
CREATE OR REPLACE FUNCTION public.fix_orphaned_invitation(invitation_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  inv_record RECORD;
  user_record RECORD;
  result json;
BEGIN
  -- Check if user is super admin
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;

  -- Get invitation details
  SELECT ci.*, c.name as company_name
  INTO inv_record
  FROM public.company_invitations ci
  JOIN public.companies c ON ci.company_id = c.id
  WHERE ci.id = invitation_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  -- Get user by email
  SELECT au.id, p.full_name
  INTO user_record
  FROM auth.users au
  JOIN public.profiles p ON p.id = au.id
  WHERE LOWER(au.email) = LOWER(inv_record.email);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found for email: %', inv_record.email;
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.user_id = user_record.id 
    AND cm.company_id = inv_record.company_id
  ) THEN
    -- Just mark as accepted
    UPDATE public.company_invitations SET accepted = true WHERE id = invitation_id_param;
    RETURN json_build_object('status', 'already_member', 'message', 'User was already a member, invitation marked as accepted');
  END IF;

  -- Add user to company_members
  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (inv_record.company_id, user_record.id, inv_record.role);

  -- Mark invitation as accepted
  UPDATE public.company_invitations SET accepted = true WHERE id = invitation_id_param;

  RETURN json_build_object(
    'status', 'fixed',
    'message', format('Added %s to %s as %s', COALESCE(user_record.full_name, inv_record.email), inv_record.company_name, inv_record.role)
  );
END;
$$;
