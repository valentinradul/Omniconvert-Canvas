-- Fix the return type mismatch in get_companies_with_owners_for_super_admin function
DROP FUNCTION IF EXISTS get_companies_with_owners_for_super_admin();

CREATE OR REPLACE FUNCTION get_companies_with_owners_for_super_admin()
RETURNS TABLE (
  id uuid,
  name text,
  created_at timestamptz,
  created_by uuid,
  member_count bigint,
  owner_name text,
  owner_email character varying  -- Changed from text to character varying to match auth.users.email type
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is super admin
  IF NOT is_super_admin(auth.uid()) THEN
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
  FROM companies c
  LEFT JOIN (
    SELECT 
      company_id,
      COUNT(*) as count
    FROM company_members
    GROUP BY company_id
  ) member_counts ON c.id = member_counts.company_id
  LEFT JOIN company_members cm ON c.id = cm.company_id AND cm.role = 'owner'
  LEFT JOIN profiles p ON cm.user_id = p.id
  LEFT JOIN auth.users au ON cm.user_id = au.id
  ORDER BY c.created_at DESC;
END;
$$;