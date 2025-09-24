-- Create security definer function to check if user is member of same company
CREATE OR REPLACE FUNCTION public.user_is_company_member(user_id uuid, company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.user_id = user_is_company_member.user_id 
    AND cm.company_id = user_is_company_member.company_id
  );
END;
$function$