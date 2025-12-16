
-- Fix Laura's membership manually
INSERT INTO company_members (company_id, user_id, role)
SELECT 
  ci.company_id,
  p.id as user_id,
  ci.role
FROM company_invitations ci
JOIN auth.users au ON au.email = ci.email
JOIN profiles p ON p.id = au.id
WHERE ci.email = 'laura.ruczui@omniconvert.com'
AND NOT EXISTS (
  SELECT 1 FROM company_members cm 
  WHERE cm.user_id = p.id AND cm.company_id = ci.company_id
);

-- Mark her invitation as accepted
UPDATE company_invitations 
SET accepted = true 
WHERE email = 'laura.ruczui@omniconvert.com';
