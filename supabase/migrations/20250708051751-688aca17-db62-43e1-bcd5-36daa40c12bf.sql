
-- Add a table to store member department permissions
CREATE TABLE public.member_department_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.company_members(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(member_id, department_id)
);

-- Enable RLS for member department permissions
ALTER TABLE public.member_department_permissions ENABLE ROW LEVEL SECURITY;

-- Allow company admins to manage department permissions
CREATE POLICY "Company admins can manage member department permissions"
  ON public.member_department_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm1
      JOIN public.company_members cm2 ON cm1.company_id = cm2.company_id
      WHERE cm1.id = member_department_permissions.member_id
      AND cm2.user_id = auth.uid()
      AND cm2.role IN ('owner', 'admin')
    )
  );

-- Allow members to view their own department permissions
CREATE POLICY "Members can view their own department permissions"
  ON public.member_department_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.id = member_department_permissions.member_id
      AND cm.user_id = auth.uid()
    )
  );

-- Add department permissions to company invitations table
ALTER TABLE public.company_invitations 
ADD COLUMN department_permissions JSONB DEFAULT '[]'::jsonb;

-- Create a function to check if a user has access to a specific department
CREATE OR REPLACE FUNCTION public.user_has_department_access(user_id UUID, department_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  has_permission BOOLEAN;
BEGIN
  -- Get user's role in the company that owns this department
  SELECT cm.role INTO user_role
  FROM public.company_members cm
  JOIN public.departments d ON d.company_id = cm.company_id
  WHERE cm.user_id = user_has_department_access.user_id
  AND d.id = user_has_department_access.department_id;
  
  -- Owners and admins have access to all departments
  IF user_role IN ('owner', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Check if member has specific permission for this department
  SELECT EXISTS (
    SELECT 1 FROM public.member_department_permissions mdp
    JOIN public.company_members cm ON cm.id = mdp.member_id
    WHERE cm.user_id = user_has_department_access.user_id
    AND mdp.department_id = user_has_department_access.department_id
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$;
