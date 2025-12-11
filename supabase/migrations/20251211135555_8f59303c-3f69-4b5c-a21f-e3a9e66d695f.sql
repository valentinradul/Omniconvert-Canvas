
-- Fix the get_companies_with_owners_for_super_admin function to properly reference is_super_admin with schema
CREATE OR REPLACE FUNCTION public.get_companies_with_owners_for_super_admin()
 RETURNS TABLE(id uuid, name text, created_at timestamp with time zone, created_by uuid, member_count bigint, owner_name text, owner_email character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Check if user is super admin (use fully qualified name)
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.created_at,
    c.created_by,
    COALESCE(member_counts.count, 0) as member_count,
    COALESCE(p.full_name, 'Unknown') as owner_name,
    COALESCE(au.email, '') as owner_email
  FROM public.companies c
  LEFT JOIN (
    SELECT 
      company_id,
      COUNT(*) as count
    FROM public.company_members
    GROUP BY company_id
  ) member_counts ON c.id = member_counts.company_id
  LEFT JOIN public.company_members cm ON c.id = cm.company_id AND cm.role = 'owner'
  LEFT JOIN public.profiles p ON cm.user_id = p.id
  LEFT JOIN auth.users au ON cm.user_id = au.id
  ORDER BY c.created_at DESC;
END;
$function$;

-- Also fix the other super admin functions that have the same issue
CREATE OR REPLACE FUNCTION public.get_all_ideas_for_super_admin()
 RETURNS TABLE(id uuid, title text, description text, category text, departmentid uuid, createdat timestamp with time zone, userid uuid, username text, tags text[], company_id uuid, is_public boolean, company_name text, department_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Check if user is super admin
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;

  RETURN QUERY
  SELECT 
    i.id,
    i.title,
    i.description,
    i.category,
    i.departmentid,
    i.createdat,
    i.userid,
    i.username,
    i.tags,
    i.company_id,
    i.is_public,
    c.name as company_name,
    d.name as department_name
  FROM public.ideas i
  LEFT JOIN public.companies c ON i.company_id = c.id
  LEFT JOIN public.departments d ON i.departmentid = d.id
  ORDER BY i.createdat DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_hypotheses_for_super_admin()
 RETURNS TABLE(id uuid, ideaid uuid, initiative text, metric text, observation text, observationcontent jsonb, pectiscore jsonb, responsibleuserid uuid, status text, userid uuid, username text, company_id uuid, createdat timestamp with time zone, company_name text, idea_title text, idea_description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Check if user is super admin
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;

  RETURN QUERY
  SELECT 
    h.id,
    h.ideaid,
    h.initiative,
    h.metric,
    h.observation,
    h.observationcontent,
    h.pectiscore,
    h.responsibleuserid,
    h.status,
    h.userid,
    h.username,
    h.company_id,
    h.createdat,
    c.name as company_name,
    i.title as idea_title,
    i.description as idea_description
  FROM public.hypotheses h
  LEFT JOIN public.companies c ON h.company_id = c.id
  LEFT JOIN public.ideas i ON h.ideaid = i.id
  ORDER BY h.createdat DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_experiments_for_super_admin()
 RETURNS TABLE(id uuid, hypothesisid uuid, startdate timestamp with time zone, enddate timestamp with time zone, status text, notes text, notes_history jsonb, observationcontent jsonb, createdat timestamp with time zone, updatedat timestamp with time zone, userid uuid, username text, company_id uuid, company_name text, hypothesis_observation text, idea_title text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Check if user is super admin
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;

  RETURN QUERY
  SELECT 
    e.id,
    e.hypothesisid,
    e.startdate,
    e.enddate,
    e.status,
    e.notes,
    e.notes_history,
    e.observationcontent,
    e.createdat,
    e.updatedat,
    e.userid,
    e.username,
    e.company_id,
    c.name as company_name,
    h.observation as hypothesis_observation,
    i.title as idea_title
  FROM public.experiments e
  LEFT JOIN public.companies c ON e.company_id = c.id
  LEFT JOIN public.hypotheses h ON e.hypothesisid = h.id
  LEFT JOIN public.ideas i ON h.ideaid = i.id
  ORDER BY e.createdat DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_company_cascade(company_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Check if user is super admin
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;

  -- Delete in correct order to avoid foreign key violations
  DELETE FROM public.experiments WHERE company_id = company_id_param;
  DELETE FROM public.hypotheses WHERE company_id = company_id_param;
  DELETE FROM public.ideas WHERE company_id = company_id_param;
  DELETE FROM public.categories WHERE company_id = company_id_param;
  DELETE FROM public.member_department_permissions 
  WHERE member_id IN (
    SELECT id FROM public.company_members WHERE company_id = company_id_param
  );
  DELETE FROM public.departments WHERE company_id = company_id_param;
  DELETE FROM public.company_members WHERE company_id = company_id_param;
  DELETE FROM public.company_invitations WHERE company_id = company_id_param;
  DELETE FROM public.company_content_settings WHERE company_id = company_id_param;
  DELETE FROM public.companies WHERE id = company_id_param;
END;
$function$;
