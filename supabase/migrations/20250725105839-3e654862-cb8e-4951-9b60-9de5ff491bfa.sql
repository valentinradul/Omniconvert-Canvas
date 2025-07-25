-- Create the is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.super_admin_users 
    WHERE super_admin_users.user_id = $1
  );
$$;