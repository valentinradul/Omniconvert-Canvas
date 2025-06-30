
-- First, let's check if the user exists and get their ID
SELECT id, email FROM auth.users WHERE email = 'marketing@omniconvert.com';

-- Check if Test123 company exists
SELECT id, name FROM public.companies WHERE name = 'Test123';

-- Check existing invitations for this user
SELECT ci.*, c.name as company_name 
FROM public.company_invitations ci
JOIN public.companies c ON ci.company_id = c.id
WHERE ci.email = 'marketing@omniconvert.com';

-- Check existing company memberships for this user
SELECT cm.*, c.name as company_name 
FROM public.company_members cm
JOIN public.companies c ON cm.company_id = c.id
JOIN auth.users u ON cm.user_id = u.id
WHERE u.email = 'marketing@omniconvert.com';

-- If the user has an accepted invitation but no membership, create the membership
-- (This assumes the user ID is found from the first query)
INSERT INTO public.company_members (company_id, user_id, role)
SELECT ci.company_id, u.id, ci.role
FROM public.company_invitations ci
JOIN auth.users u ON u.email = ci.email
WHERE ci.email = 'marketing@omniconvert.com' 
  AND ci.accepted = true
  AND NOT EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.company_id = ci.company_id 
    AND cm.user_id = u.id
  );

-- Mark any pending invitations as accepted if the user should have access
UPDATE public.company_invitations 
SET accepted = true 
WHERE email = 'marketing@omniconvert.com' 
  AND company_id IN (SELECT id FROM public.companies WHERE name = 'Test123')
  AND accepted = false;
