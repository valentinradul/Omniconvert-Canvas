-- Create a function to accept invitations that bypasses RLS issues
CREATE OR REPLACE FUNCTION public.accept_company_invitation(
  invitation_id_param uuid,
  accepting_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  inv_record RECORD;
  new_member RECORD;
  result json;
BEGIN
  -- Get invitation details
  SELECT ci.*, c.name as company_name
  INTO inv_record
  FROM public.company_invitations ci
  JOIN public.companies c ON ci.company_id = c.id
  WHERE ci.id = invitation_id_param;

  IF NOT FOUND THEN
    RETURN json_build_object('status', 'error', 'message', 'Invitation not found');
  END IF;

  -- Verify the user's email matches the invitation email
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = accepting_user_id 
    AND LOWER(email) = LOWER(inv_record.email)
  ) THEN
    RETURN json_build_object('status', 'error', 'message', 'This invitation is not for your email address');
  END IF;

  -- Check if invitation is already accepted
  IF inv_record.accepted = true THEN
    RETURN json_build_object('status', 'already_accepted', 'message', 'This invitation has already been accepted');
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.user_id = accepting_user_id 
    AND cm.company_id = inv_record.company_id
  ) THEN
    -- Just mark as accepted
    UPDATE public.company_invitations SET accepted = true WHERE id = invitation_id_param;
    RETURN json_build_object('status', 'already_member', 'message', 'You are already a member of this company', 'company_id', inv_record.company_id, 'company_name', inv_record.company_name);
  END IF;

  -- Add user to company_members
  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (inv_record.company_id, accepting_user_id, inv_record.role)
  RETURNING * INTO new_member;

  -- Handle department permissions for members
  IF inv_record.role = 'member' AND inv_record.department_permissions IS NOT NULL AND jsonb_array_length(inv_record.department_permissions) > 0 THEN
    INSERT INTO public.member_department_permissions (member_id, department_id)
    SELECT new_member.id, dept_id::uuid
    FROM jsonb_array_elements_text(inv_record.department_permissions) AS dept_id;
  END IF;

  -- Mark invitation as accepted
  UPDATE public.company_invitations SET accepted = true WHERE id = invitation_id_param;

  RETURN json_build_object(
    'status', 'success',
    'message', format('Welcome to %s!', inv_record.company_name),
    'company_id', inv_record.company_id,
    'company_name', inv_record.company_name,
    'role', inv_record.role,
    'member_id', new_member.id
  );
END;
$function$;