
-- Add foreign key constraint between company_members.user_id and profiles.id
ALTER TABLE public.company_members 
ADD CONSTRAINT fk_company_members_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
