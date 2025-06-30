
-- First, let's add a unique constraint to prevent multiple owners per company
-- This will ensure only one owner per company
ALTER TABLE public.company_members 
ADD CONSTRAINT unique_company_owner 
EXCLUDE (company_id WITH =) 
WHERE (role = 'owner');

-- Update company names to include their IDs for better identification
UPDATE public.companies 
SET name = name || ' (' || SUBSTRING(id::text, 1, 8) || ')'
WHERE name NOT LIKE '%(%';
