-- Add structured notes column to experiments table
-- This will replace the simple text notes with a JSONB array to track note history
ALTER TABLE public.experiments 
ADD COLUMN notes_history JSONB DEFAULT '[]'::jsonb;

-- Create an index for better performance when querying notes
CREATE INDEX idx_experiments_notes_history ON public.experiments USING GIN(notes_history);

-- Update existing experiments with simple notes to the new structure
-- Convert existing text notes to the new structured format
UPDATE public.experiments 
SET notes_history = CASE 
  WHEN notes IS NOT NULL AND notes != '' THEN 
    jsonb_build_array(
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'content', notes,
        'created_at', createdat,
        'created_by', COALESCE(userid, '00000000-0000-0000-0000-000000000000'::uuid),
        'author_name', COALESCE(username, 'Unknown User')
      )
    )
  ELSE '[]'::jsonb
END
WHERE notes_history = '[]'::jsonb;