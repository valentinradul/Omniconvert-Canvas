-- Set search path for security definer functions to prevent search path manipulation
ALTER FUNCTION public.user_is_company_member(uuid, uuid) SET search_path = '';
ALTER FUNCTION public.user_has_company_admin_role(uuid, uuid) SET search_path = '';
ALTER FUNCTION public.get_current_user_email() SET search_path = '';
ALTER FUNCTION public.is_super_admin(uuid) SET search_path = '';
ALTER FUNCTION public.user_has_department_access(uuid, uuid) SET search_path = '';
ALTER FUNCTION public.get_all_ideas_for_super_admin() SET search_path = '';
ALTER FUNCTION public.get_all_experiments_for_super_admin() SET search_path = '';
ALTER FUNCTION public.get_all_hypotheses_for_super_admin() SET search_path = '';
ALTER FUNCTION public.get_companies_with_owners_for_super_admin() SET search_path = '';
ALTER FUNCTION public.delete_company_cascade(uuid) SET search_path = '';
ALTER FUNCTION public.is_member_of_same_company(uuid) SET search_path = '';
ALTER FUNCTION public.user_has_company_access(uuid, uuid) SET search_path = '';
ALTER FUNCTION public.get_user_company_role(uuid, uuid) SET search_path = '';
ALTER FUNCTION public.has_company_invitation(text, uuid) SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.create_team_for_user() SET search_path = '';