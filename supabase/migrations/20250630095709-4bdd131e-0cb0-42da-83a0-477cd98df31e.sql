
-- Get the user ID for cristina.baraitarus@omniconvert.com
WITH cristina_user AS (
  SELECT id FROM auth.users WHERE email = 'cristina.baraitarus@omniconvert.com'
)
-- Get all companies created by Cristina with their IDs
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.created_at,
  -- Check if this company has an invitation for marketing@omniconvert.com
  EXISTS (
    SELECT 1 FROM company_invitations ci 
    WHERE ci.company_id = c.id 
    AND ci.email = 'marketing@omniconvert.com'
  ) as has_marketing_invitation
FROM public.companies c
JOIN cristina_user u ON c.created_by = u.id
ORDER BY c.created_at;

-- Also get details of the invitation if it exists
SELECT 
  ci.id as invitation_id,
  ci.company_id,
  c.name as company_name,
  ci.email,
  ci.role,
  ci.accepted,
  ci.created_at as invitation_created_at
FROM company_invitations ci
JOIN companies c ON ci.company_id = c.id
JOIN auth.users u ON c.created_by = u.id
WHERE u.email = 'cristina.baraitarus@omniconvert.com'
AND ci.email = 'marketing@omniconvert.com';
