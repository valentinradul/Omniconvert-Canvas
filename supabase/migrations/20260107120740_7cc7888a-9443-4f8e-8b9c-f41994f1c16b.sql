-- Add visibility column to reporting_metrics for cross-category display
ALTER TABLE public.reporting_metrics
ADD COLUMN IF NOT EXISTS visible_in_categories uuid[] DEFAULT '{}';

-- Add unique constraint for metric_id + period_date if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'reporting_metric_values_metric_period_unique'
    ) THEN
        ALTER TABLE public.reporting_metric_values
        ADD CONSTRAINT reporting_metric_values_metric_period_unique 
        UNIQUE (metric_id, period_date);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;