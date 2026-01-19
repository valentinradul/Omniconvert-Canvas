-- Add is_archived column to ideas table
ALTER TABLE public.ideas 
ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster filtering
CREATE INDEX idx_ideas_is_archived ON public.ideas(is_archived);