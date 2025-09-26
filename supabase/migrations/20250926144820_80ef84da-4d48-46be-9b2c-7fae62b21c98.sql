-- Update the check constraint to allow the correct roles
ALTER TABLE public.company_invitations 
DROP CONSTRAINT company_invitations_role_check;

-- Add the updated check constraint with the correct roles
ALTER TABLE public.company_invitations 
ADD CONSTRAINT company_invitations_role_check 
CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text]));