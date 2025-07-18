-- Function to get all hypotheses for super admins
CREATE OR REPLACE FUNCTION get_all_hypotheses_for_super_admin()
RETURNS TABLE (
  id uuid,
  ideaid uuid,
  initiative text,
  metric text,
  observation text,
  observationcontent jsonb,
  pectiscore jsonb,
  responsibleuserid uuid,
  status text,
  userid uuid,
  username text,
  company_id uuid,
  createdat timestamptz,
  company_name text,
  idea_title text,
  idea_description text
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
  FROM hypotheses h
  LEFT JOIN companies c ON h.company_id = c.id
  LEFT JOIN ideas i ON h.ideaid = i.id
  ORDER BY h.createdat DESC;
END;
$$;