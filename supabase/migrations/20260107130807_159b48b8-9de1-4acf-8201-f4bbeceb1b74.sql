-- Create table for saved charts
CREATE TABLE public.saved_charts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  metric_ids UUID[] NOT NULL,
  chart_type TEXT NOT NULL DEFAULT 'line',
  date_range_preset TEXT,
  custom_start_date DATE,
  custom_end_date DATE,
  granularity TEXT NOT NULL DEFAULT 'month',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_charts ENABLE ROW LEVEL SECURITY;

-- Policies for saved_charts
CREATE POLICY "Users can view saved charts in their company"
ON public.saved_charts
FOR SELECT
USING (company_id IN (
  SELECT company_id FROM company_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create saved charts in their company"
ON public.saved_charts
FOR INSERT
WITH CHECK (company_id IN (
  SELECT company_id FROM company_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update saved charts in their company"
ON public.saved_charts
FOR UPDATE
USING (company_id IN (
  SELECT company_id FROM company_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete saved charts in their company"
ON public.saved_charts
FOR DELETE
USING (company_id IN (
  SELECT company_id FROM company_members WHERE user_id = auth.uid()
));