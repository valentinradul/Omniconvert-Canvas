-- Add title field to experiments table
ALTER TABLE public.experiments 
ADD COLUMN title TEXT;