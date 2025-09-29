-- Fix company_members role constraint to allow owner, admin, member
ALTER TABLE public.company_members 
DROP CONSTRAINT company_members_role_check;

-- Add the updated check constraint with the correct roles
ALTER TABLE public.company_members 
ADD CONSTRAINT company_members_role_check 
CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text]));

-- Now fix Matei Lungu's company membership
-- Update the OMV invitation to accepted
UPDATE company_invitations 
SET accepted = true 
WHERE email = 'matei.lungu@omniconvert.com' 
AND company_id = 'e12e0032-60bb-458c-82b9-cd69c6c6a91e';

-- Insert the company membership for OMV
INSERT INTO company_members (user_id, company_id, role)
VALUES (
  '23f19ffa-fb6b-44f4-9b8d-ef529315a452', 
  'e12e0032-60bb-458c-82b9-cd69c6c6a91e', 
  'admin'
) ON CONFLICT DO NOTHING;