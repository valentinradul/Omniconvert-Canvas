
-- Create super admin role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE super_admin_role AS ENUM ('super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create super_admin_users table to track super admins
CREATE TABLE IF NOT EXISTS public.super_admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS on super_admin_users
ALTER TABLE public.super_admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for super admins to manage super admin users
CREATE POLICY "Super admins can manage super admin users" ON public.super_admin_users
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.super_admin_users sau
        WHERE sau.user_id = auth.uid() AND sau.is_active = true
    )
);

-- Create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(name, company_id)
);

-- Enable RLS on departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Create policies for departments
CREATE POLICY "Super admins can manage all departments" ON public.departments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.super_admin_users sau
        WHERE sau.user_id = auth.uid() AND sau.is_active = true
    )
);

CREATE POLICY "Company members can view departments" ON public.departments
FOR SELECT USING (
    user_has_company_access(auth.uid(), company_id)
);

CREATE POLICY "Company admins can manage departments" ON public.departments
FOR ALL USING (
    user_has_company_admin_role(auth.uid(), company_id)
);

-- Add department_id to company_members if it doesn't exist
ALTER TABLE public.company_members 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Update company policies to allow super admin access
CREATE POLICY "Super admins can manage all companies" ON public.companies
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.super_admin_users sau
        WHERE sau.user_id = auth.uid() AND sau.is_active = true
    )
);

-- Update company_members policies to allow super admin access
CREATE POLICY "Super admins can manage all company members" ON public.company_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.super_admin_users sau
        WHERE sau.user_id = auth.uid() AND sau.is_active = true
    )
);

-- Update company_invitations policies to allow super admin access
CREATE POLICY "Super admins can manage all company invitations" ON public.company_invitations
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.super_admin_users sau
        WHERE sau.user_id = auth.uid() AND sau.is_active = true
    )
);

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.super_admin_users
        WHERE super_admin_users.user_id = is_super_admin.user_id 
        AND is_active = true
    );
$$;

-- Create trigger to update departments updated_at
CREATE OR REPLACE FUNCTION public.update_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_departments_updated_at_trigger
    BEFORE UPDATE ON public.departments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_departments_updated_at();
