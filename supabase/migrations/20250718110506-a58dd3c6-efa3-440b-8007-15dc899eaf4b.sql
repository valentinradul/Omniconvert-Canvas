-- Create a function to delete a company and all its related data
CREATE OR REPLACE FUNCTION delete_company_cascade(company_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;

  -- Delete in correct order to avoid foreign key violations
  
  -- 1. Delete experiments first (they may reference hypotheses)
  DELETE FROM experiments WHERE company_id = company_id_param;
  
  -- 2. Delete hypotheses (they may reference ideas) 
  DELETE FROM hypotheses WHERE company_id = company_id_param;
  
  -- 3. Delete ideas
  DELETE FROM ideas WHERE company_id = company_id_param;
  
  -- 4. Delete categories
  DELETE FROM categories WHERE company_id = company_id_param;
  
  -- 5. Delete member department permissions (via company members)
  DELETE FROM member_department_permissions 
  WHERE member_id IN (
    SELECT id FROM company_members WHERE company_id = company_id_param
  );
  
  -- 6. Delete departments
  DELETE FROM departments WHERE company_id = company_id_param;
  
  -- 7. Delete company members
  DELETE FROM company_members WHERE company_id = company_id_param;
  
  -- 8. Delete company invitations
  DELETE FROM company_invitations WHERE company_id = company_id_param;
  
  -- 9. Delete company content settings
  DELETE FROM company_content_settings WHERE company_id = company_id_param;
  
  -- 10. Finally delete the company
  DELETE FROM companies WHERE id = company_id_param;
  
END;
$$;