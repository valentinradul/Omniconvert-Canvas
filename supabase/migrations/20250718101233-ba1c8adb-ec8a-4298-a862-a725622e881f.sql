-- Function to get all ideas for super admins
CREATE OR REPLACE FUNCTION get_all_ideas_for_super_admin()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  category text,
  departmentid uuid,
  createdat timestamptz,
  userid uuid,
  username text,
  tags text[],
  company_id uuid,
  is_public boolean,
  company_name text,
  department_name text
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
  FROM ideas i
  LEFT JOIN companies c ON i.company_id = c.id
  LEFT JOIN departments d ON i.departmentid = d.id
  ORDER BY i.createdat DESC;
END;
$$;

-- Function to get all experiments for super admins  
CREATE OR REPLACE FUNCTION get_all_experiments_for_super_admin()
RETURNS TABLE (
  id uuid,
  hypothesisid uuid,
  startdate timestamptz,
  enddate timestamptz,
  status text,
  notes text,
  notes_history jsonb,
  observationcontent jsonb,
  createdat timestamptz,
  updatedat timestamptz,
  userid uuid,
  username text,
  company_id uuid,
  company_name text,
  hypothesis_observation text,
  idea_title text
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
  FROM experiments e
  LEFT JOIN companies c ON e.company_id = c.id
  LEFT JOIN hypotheses h ON e.hypothesisid = h.id
  LEFT JOIN ideas i ON h.ideaid = i.id
  ORDER BY e.createdat DESC;
END;
$$;