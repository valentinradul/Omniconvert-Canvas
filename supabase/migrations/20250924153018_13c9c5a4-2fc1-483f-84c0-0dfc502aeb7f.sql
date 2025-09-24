-- Create table for tracking individual experiment costs and revenues
CREATE TABLE public.experiment_financials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cost', 'revenue')),
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  description TEXT,
  added_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add constraints
ALTER TABLE public.experiment_financials ADD CONSTRAINT period_end_after_start CHECK (period_end >= period_start);

-- Enable RLS
ALTER TABLE public.experiment_financials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view financials from their company experiments" 
ON public.experiment_financials 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.experiments e
    WHERE e.id = experiment_financials.experiment_id
    AND (
      e.company_id IS NULL OR 
      user_has_company_access(auth.uid(), e.company_id) OR 
      e.userid = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert financials for their company experiments" 
ON public.experiment_financials 
FOR INSERT 
WITH CHECK (
  added_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.experiments e
    WHERE e.id = experiment_financials.experiment_id
    AND (
      e.company_id IS NULL OR 
      user_has_company_access(auth.uid(), e.company_id) OR 
      e.userid = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own financials" 
ON public.experiment_financials 
FOR UPDATE 
USING (
  added_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.experiments e
    WHERE e.id = experiment_financials.experiment_id
    AND (
      e.company_id IS NULL OR 
      user_has_company_access(auth.uid(), e.company_id) OR 
      e.userid = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete their own financials" 
ON public.experiment_financials 
FOR DELETE 
USING (
  added_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.experiments e
    WHERE e.id = experiment_financials.experiment_id
    AND (
      e.company_id IS NULL OR 
      user_has_company_access(auth.uid(), e.company_id) OR 
      e.userid = auth.uid()
    )
  )
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_experiment_financials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_experiment_financials_updated_at
BEFORE UPDATE ON public.experiment_financials
FOR EACH ROW
EXECUTE FUNCTION public.update_experiment_financials_updated_at();