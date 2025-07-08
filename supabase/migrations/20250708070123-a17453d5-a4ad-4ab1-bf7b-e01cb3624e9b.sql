
-- Add a new table to store company-wide content visibility settings
CREATE TABLE public.company_content_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  restrict_content_to_departments BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS on the new table
ALTER TABLE public.company_content_settings ENABLE ROW LEVEL SECURITY;

-- Allow company admins to manage their settings
CREATE POLICY "Company admins can manage content settings"
ON public.company_content_settings
FOR ALL
USING (user_has_company_admin_role(auth.uid(), company_id))
WITH CHECK (user_has_company_admin_role(auth.uid(), company_id));

-- Allow company members to view their company's settings
CREATE POLICY "Company members can view content settings"
ON public.company_content_settings
FOR SELECT
USING (user_has_company_access(auth.uid(), company_id));

-- Allow super admins to manage all settings
CREATE POLICY "Super admins can manage all content settings"
ON public.company_content_settings
FOR ALL
USING (is_super_admin(auth.uid()));

-- Create trigger to update timestamp
CREATE OR REPLACE FUNCTION public.update_company_content_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_content_settings_updated_at
  BEFORE UPDATE ON public.company_content_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_content_settings_updated_at();
