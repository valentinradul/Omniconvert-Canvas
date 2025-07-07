
-- Add department_permissions column to company_invitations to store which departments the invitee will have access to
ALTER TABLE public.company_invitations 
ADD COLUMN department_permissions JSONB DEFAULT '{"all": true}'::jsonb;

-- Create a table to store member department permissions
CREATE TABLE IF NOT EXISTS public.member_department_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  department_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT member_department_permissions_user_company_unique UNIQUE (user_id, company_id, department_id)
);

-- Add foreign key constraints
ALTER TABLE public.member_department_permissions 
ADD CONSTRAINT member_dept_perms_user_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.member_department_permissions 
ADD CONSTRAINT member_dept_perms_company_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.member_department_permissions 
ADD CONSTRAINT member_dept_perms_department_fkey 
FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.member_department_permissions ENABLE ROW LEVEL SECURITY;

-- Allow company admins to manage department permissions
CREATE POLICY "Admins can manage department permissions" 
ON public.member_department_permissions 
FOR ALL 
USING (user_has_company_admin_role(auth.uid(), company_id))
WITH CHECK (user_has_company_admin_role(auth.uid(), company_id));

-- Allow users to view their own department permissions
CREATE POLICY "Users can view their own department permissions" 
ON public.member_department_permissions 
FOR SELECT 
USING (auth.uid() = user_id);
