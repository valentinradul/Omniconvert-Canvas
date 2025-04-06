
DO $$
DECLARE
  user_id UUID;
  company_id UUID;
BEGIN
  -- Get the user ID for the specific email
  SELECT id INTO user_id FROM auth.users WHERE email = 'eusuntvalentin@gmail.com';
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email eusuntvalentin@gmail.com not found';
  END IF;

  -- Check if the Omniconvert company exists
  IF NOT EXISTS (SELECT 1 FROM companies WHERE name = 'Omniconvert') THEN
    -- Create the Omniconvert company for the user
    INSERT INTO companies (name, created_by)
    VALUES ('Omniconvert', user_id)
    RETURNING id INTO company_id;
  ELSE
    -- Get the company ID for Omniconvert
    SELECT id INTO company_id FROM companies WHERE name = 'Omniconvert';
  END IF;

  -- Make sure the user is an owner of the company
  IF NOT EXISTS (SELECT 1 FROM company_members 
                WHERE company_members.company_id = company_id 
                AND company_members.user_id = user_id) THEN
    INSERT INTO company_members (company_id, user_id, role)
    VALUES (company_id, user_id, 'owner');
  END IF;

  -- Migrate all existing hypotheses to the company
  UPDATE hypotheses
  SET company_id = company_id
  WHERE hypotheses.company_id IS NULL AND hypotheses.userid = user_id;

  -- Migrate all existing experiments to the company
  UPDATE experiments
  SET company_id = company_id
  WHERE experiments.company_id IS NULL AND experiments.userid = user_id;

  -- Migrate all existing ideas to the company
  UPDATE ideas
  SET company_id = company_id
  WHERE ideas.company_id IS NULL AND ideas.userid = user_id;

END $$;
