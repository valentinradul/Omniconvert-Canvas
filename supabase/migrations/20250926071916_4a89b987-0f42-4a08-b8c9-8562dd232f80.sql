-- Add enable_financial_tracking column to company_content_settings
ALTER TABLE public.company_content_settings 
ADD COLUMN enable_financial_tracking boolean NOT NULL DEFAULT true;

-- Update the trigger to handle the new column
DROP TRIGGER IF EXISTS update_company_content_settings_updated_at ON public.company_content_settings;
CREATE TRIGGER update_company_content_settings_updated_at
  BEFORE UPDATE ON public.company_content_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_content_settings_updated_at();