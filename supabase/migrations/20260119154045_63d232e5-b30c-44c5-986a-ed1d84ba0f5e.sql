-- Add is_archived column to hypotheses table
ALTER TABLE public.hypotheses 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;

-- Add is_archived column to experiments table
ALTER TABLE public.experiments 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hypotheses_is_archived ON public.hypotheses(is_archived);
CREATE INDEX IF NOT EXISTS idx_experiments_is_archived ON public.experiments(is_archived);