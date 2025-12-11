-- Mark Ana's invitation as accepted since we're fixing her membership manually
UPDATE company_invitations 
SET accepted = true 
WHERE id = 'dde6d4b1-fdf0-4d6a-b324-6740ff035e06' 
AND email = 'ana.zamfirache@omniconvert.com';