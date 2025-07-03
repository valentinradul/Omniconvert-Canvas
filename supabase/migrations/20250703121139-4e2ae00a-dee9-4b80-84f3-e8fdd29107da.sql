-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, company_id)
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for category access
CREATE POLICY "Users can view categories from their companies" 
ON public.categories 
FOR SELECT 
USING (user_has_company_access(auth.uid(), company_id));

CREATE POLICY "Owners and admins can manage categories" 
ON public.categories 
FOR ALL 
USING (user_has_company_admin_role(auth.uid(), company_id))
WITH CHECK (user_has_company_admin_role(auth.uid(), company_id));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_categories_updated_at();

-- Insert default categories for existing companies
INSERT INTO public.categories (name, company_id)
SELECT category_name, c.id
FROM (VALUES 
  ('Outreach'),
  ('Paid Ads'), 
  ('Events'),
  ('Onboarding'),
  ('Product-led'),
  ('Content Marketing'),
  ('SEO'),
  ('Partnerships'),
  ('Other')
) AS default_categories(category_name)
CROSS JOIN public.companies c;