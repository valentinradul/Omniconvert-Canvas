
-- Create a table to store member department permissions
CREATE TABLE public.member_department_permissions (
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

-- Add department_permissions column to company_invitations to store which departments the invitee will have access to
ALTER TABLE public.company_invitations 
ADD COLUMN department_permissions JSONB DEFAULT '{"all": true}'::jsonb;

-- Update the departments RLS policy to check department permissions for members
DROP POLICY IF EXISTS "Users can view departments from their companies" ON public.departments;

CREATE POLICY "Users can view departments from their companies" 
ON public.departments 
FOR SELECT 
USING (
  user_has_company_access(auth.uid(), company_id) AND (
    -- Owners and admins can see all departments
    user_has_company_admin_role(auth.uid(), company_id) OR
    -- Members can only see departments they have permission for
    EXISTS (
      SELECT 1 FROM public.member_department_permissions mdp 
      WHERE mdp.user_id = auth.uid() 
      AND mdp.company_id = departments.company_id 
      AND (mdp.department_id = departments.id OR mdp.department_id IS NULL)
    )
  )
);

-- Create a function to grant department permissions to a user
CREATE OR REPLACE FUNCTION public.grant_department_permissions(
  p_user_id UUID,
  p_company_id UUID,
  p_department_ids UUID[] DEFAULT NULL -- NULL means all departments
)
RETURNS VOID AS $$
BEGIN
  -- Delete existing permissions for this user and company
  DELETE FROM public.member_department_permissions 
  WHERE user_id = p_user_id AND company_id = p_company_id;
  
  -- If department_ids is NULL or empty, grant access to all departments (represented by NULL department_id)
  IF p_department_ids IS NULL OR array_length(p_department_ids, 1) IS NULL THEN
    INSERT INTO public.member_department_permissions (user_id, company_id, department_id)
    VALUES (p_user_id, p_company_id, NULL);
  ELSE
    -- Insert specific department permissions
    INSERT INTO public.member_department_permissions (user_id, company_id, department_id)
    SELECT p_user_id, p_company_id, unnest(p_department_ids);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
