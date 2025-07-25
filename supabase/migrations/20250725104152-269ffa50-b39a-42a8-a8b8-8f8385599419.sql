-- Fix remaining functions that still have mutable search paths
ALTER FUNCTION public.can_add_company_member(uuid, uuid) SET search_path = '';
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = '';
ALTER FUNCTION public.add_company_owner() SET search_path = '';
ALTER FUNCTION public.update_departments_updated_at() SET search_path = '';
ALTER FUNCTION public.update_company_content_settings_updated_at() SET search_path = '';
ALTER FUNCTION public.update_categories_updated_at() SET search_path = '';