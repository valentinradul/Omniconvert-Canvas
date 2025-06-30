
-- First, let's see if the users exist
SELECT id, email, created_at FROM auth.users WHERE email = 'cristina.baraitarus@omniconvert.com';

-- Check if marketing user exists
SELECT id, email, created_at FROM auth.users WHERE email = 'marketing@omniconvert.com';

-- Check all companies in the system (to see if any exist)
SELECT id, name, created_by, created_at FROM public.companies ORDER BY created_at DESC LIMIT 10;

-- Check all company members for both users (if they exist)
SELECT 
  cm.id,
  cm.company_id,
  cm.user_id,
  cm.role,
  c.name as company_name,
  u.email as user_email
FROM company_members cm
JOIN companies c ON cm.company_id = c.id
JOIN auth.users u ON cm.user_id = u.id
WHERE u.email IN ('cristina.baraitarus@omniconvert.com', 'marketing@omniconvert.com');

-- Check all invitations from or to these email addresses
SELECT 
  ci.id,
  ci.company_id,
  ci.email,
  ci.role,
  ci.accepted,
  c.name as company_name,
  inviter.email as invited_by_email
FROM company_invitations ci
JOIN companies c ON ci.company_id = c.id
LEFT JOIN auth.users inviter ON ci.invited_by = inviter.id
WHERE ci.email IN ('cristina.baraitarus@omniconvert.com', 'marketing@omniconvert.com')
   OR inviter.email IN ('cristina.baraitarus@omniconvert.com', 'marketing@omniconvert.com');
