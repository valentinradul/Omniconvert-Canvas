
-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Super admins can manage super admin users" ON public.super_admin_users;

-- Create a simpler policy that allows users to manage their own records
-- and allows existing super admins to manage others without recursion
CREATE POLICY "Super admins can manage super admin users" ON public.super_admin_users
FOR ALL USING (
    -- Allow users to see their own record
    user_id = auth.uid() 
    OR 
    -- Allow if the current user is already in the super_admin_users table
    -- This avoids recursion by directly checking the table without using the function
    auth.uid() IN (
        SELECT sau.user_id 
        FROM public.super_admin_users sau 
        WHERE sau.is_active = true
    )
);

-- Update the is_super_admin function to be more efficient and avoid potential recursion
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.super_admin_users
        WHERE super_admin_users.user_id = COALESCE(is_super_admin.user_id, auth.uid())
        AND is_active = true
    );
$$;
