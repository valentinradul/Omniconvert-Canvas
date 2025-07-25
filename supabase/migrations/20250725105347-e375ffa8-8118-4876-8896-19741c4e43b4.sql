-- Fix the super admin RLS policy for companies table
DROP POLICY IF EXISTS "Super admins can manage all companies" ON companies;

CREATE POLICY "Super admins can manage all companies" 
ON companies 
FOR ALL 
USING (is_super_admin(auth.uid()));