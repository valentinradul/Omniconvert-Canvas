-- Fix: Add Ana Zamfirache to Omniconvert company (her invitation is accepted but membership wasn't created)
INSERT INTO public.company_members (company_id, user_id, role)
SELECT 
  'dff411eb-ae53-4724-8456-5db4fff10441', -- Omniconvert company
  '50e448e5-28b9-4f04-b9b7-ac5a17b309a2', -- Ana's user ID
  'member'
WHERE NOT EXISTS (
  SELECT 1 FROM public.company_members 
  WHERE company_id = 'dff411eb-ae53-4724-8456-5db4fff10441' 
  AND user_id = '50e448e5-28b9-4f04-b9b7-ac5a17b309a2'
);

-- Fix any other accepted invitations that don't have corresponding company_members
-- This handles orphaned accepted invitations
INSERT INTO public.company_members (company_id, user_id, role)
SELECT DISTINCT
  ci.company_id,
  p.id as user_id,
  ci.role
FROM public.company_invitations ci
JOIN auth.users au ON au.email = ci.email
JOIN public.profiles p ON p.id = au.id
WHERE ci.accepted = true
AND NOT EXISTS (
  SELECT 1 FROM public.company_members cm 
  WHERE cm.company_id = ci.company_id 
  AND cm.user_id = p.id
);