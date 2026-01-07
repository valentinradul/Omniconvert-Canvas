-- Add enable_reporting flag to company_content_settings
ALTER TABLE public.company_content_settings 
ADD COLUMN IF NOT EXISTS enable_reporting boolean NOT NULL DEFAULT false;

-- Create reporting_categories table for the hierarchy
CREATE TABLE public.reporting_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  parent_id uuid REFERENCES public.reporting_categories(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, slug)
);

-- Create reporting_metrics table for metric definitions
CREATE TABLE public.reporting_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.reporting_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  source text, -- e.g., 'Google Analytics', 'Hubspot', 'Manual', etc.
  integration_type text, -- e.g., 'google_analytics', 'hubspot', 'google_ads', etc.
  integration_field text, -- The specific field from the integration
  is_calculated boolean NOT NULL DEFAULT false,
  calculation_formula text, -- For calculated fields
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create reporting_metric_values table for storing values per period
CREATE TABLE public.reporting_metric_values (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_id uuid NOT NULL REFERENCES public.reporting_metrics(id) ON DELETE CASCADE,
  period_date date NOT NULL, -- First day of the month for monthly data
  value numeric,
  is_manual_override boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(metric_id, period_date)
);

-- Enable RLS on all new tables
ALTER TABLE public.reporting_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporting_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporting_metric_values ENABLE ROW LEVEL SECURITY;

-- RLS policies for reporting_categories
CREATE POLICY "Users can view reporting categories from their companies"
ON public.reporting_categories FOR SELECT
USING (user_has_company_access(auth.uid(), company_id));

CREATE POLICY "Company admins can manage reporting categories"
ON public.reporting_categories FOR ALL
USING (user_has_company_admin_role(auth.uid(), company_id))
WITH CHECK (user_has_company_admin_role(auth.uid(), company_id));

CREATE POLICY "Super admins can manage all reporting categories"
ON public.reporting_categories FOR ALL
USING (is_super_admin(auth.uid()));

-- RLS policies for reporting_metrics
CREATE POLICY "Users can view reporting metrics from their companies"
ON public.reporting_metrics FOR SELECT
USING (EXISTS (
  SELECT 1 FROM reporting_categories rc
  WHERE rc.id = reporting_metrics.category_id
  AND user_has_company_access(auth.uid(), rc.company_id)
));

CREATE POLICY "Company members can manage reporting metrics"
ON public.reporting_metrics FOR ALL
USING (EXISTS (
  SELECT 1 FROM reporting_categories rc
  WHERE rc.id = reporting_metrics.category_id
  AND user_has_company_access(auth.uid(), rc.company_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM reporting_categories rc
  WHERE rc.id = reporting_metrics.category_id
  AND user_has_company_access(auth.uid(), rc.company_id)
));

CREATE POLICY "Super admins can manage all reporting metrics"
ON public.reporting_metrics FOR ALL
USING (is_super_admin(auth.uid()));

-- RLS policies for reporting_metric_values
CREATE POLICY "Users can view reporting metric values from their companies"
ON public.reporting_metric_values FOR SELECT
USING (EXISTS (
  SELECT 1 FROM reporting_metrics rm
  JOIN reporting_categories rc ON rc.id = rm.category_id
  WHERE rm.id = reporting_metric_values.metric_id
  AND user_has_company_access(auth.uid(), rc.company_id)
));

CREATE POLICY "Company members can manage reporting metric values"
ON public.reporting_metric_values FOR ALL
USING (EXISTS (
  SELECT 1 FROM reporting_metrics rm
  JOIN reporting_categories rc ON rc.id = rm.category_id
  WHERE rm.id = reporting_metric_values.metric_id
  AND user_has_company_access(auth.uid(), rc.company_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM reporting_metrics rm
  JOIN reporting_categories rc ON rc.id = rm.category_id
  WHERE rm.id = reporting_metric_values.metric_id
  AND user_has_company_access(auth.uid(), rc.company_id)
));

CREATE POLICY "Super admins can manage all reporting metric values"
ON public.reporting_metric_values FOR ALL
USING (is_super_admin(auth.uid()));

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_reporting_categories_updated_at
  BEFORE UPDATE ON public.reporting_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reporting_metrics_updated_at
  BEFORE UPDATE ON public.reporting_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reporting_metric_values_updated_at
  BEFORE UPDATE ON public.reporting_metric_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();