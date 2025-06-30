
-- First, let's find the user ID for cristina.baraitarus@omniconvert.com
SELECT id, email FROM auth.users WHERE email = 'cristina.baraitarus@omniconvert.com';

-- Then find all companies created by this user
SELECT c.id, c.name, c.created_at, c.created_by
FROM public.companies c
JOIN auth.users u ON c.created_by = u.id
WHERE u.email = 'cristina.baraitarus@omniconvert.com';
