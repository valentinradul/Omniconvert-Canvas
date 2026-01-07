-- Add enable_gtm_calculator column to company_content_settings
ALTER TABLE public.company_content_settings
ADD COLUMN enable_gtm_calculator boolean NOT NULL DEFAULT false;

-- Set enable_gtm_calculator to true for Omniconvert company
UPDATE public.company_content_settings
SET enable_gtm_calculator = true
WHERE company_id = (
  SELECT id FROM public.companies WHERE name = 'Omniconvert' LIMIT 1
);

-- If Omniconvert doesn't have content settings yet, insert them
INSERT INTO public.company_content_settings (company_id, enable_gtm_calculator, restrict_content_to_departments, enable_financial_tracking)
SELECT id, true, false, true
FROM public.companies
WHERE name = 'Omniconvert'
AND NOT EXISTS (
  SELECT 1 FROM public.company_content_settings WHERE company_id = companies.id
);