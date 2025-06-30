
-- Get all companies and their creators
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.created_by,
  u.email as creator_email,
  c.created_at
FROM companies c
LEFT JOIN auth.users u ON c.created_by = u.id
ORDER BY c.created_at DESC;

-- Get all company invitations
SELECT 
  ci.id as invitation_id,
  ci.company_id,
  c.name as company_name,
  ci.email as invited_email,
  ci.role,
  ci.accepted,
  inviter.email as invited_by_email,
  ci.created_at
FROM company_invitations ci
JOIN companies c ON ci.company_id = c.id
LEFT JOIN auth.users inviter ON ci.invited_by = inviter.id
ORDER BY ci.created_at DESC;

-- Get all company members
SELECT 
  cm.id,
  cm.company_id,
  c.name as company_name,
  cm.user_id,
  u.email as member_email,
  cm.role,
  cm.created_at
FROM company_members cm
JOIN companies c ON cm.company_id = c.id
LEFT JOIN auth.users u ON cm.user_id = u.id
ORDER BY cm.created_at DESC;

-- Check specific users
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN ('cristina.baraitarus@omniconvert.com', 'marketing@omniconvert.com')
ORDER BY created_at DESC;
