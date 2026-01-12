-- Create company OAuth tokens table for storing platform tokens
CREATE TABLE public.company_oauth_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  account_id TEXT,
  account_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, provider)
);

-- Enable Row Level Security
ALTER TABLE public.company_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Company admins can view OAuth tokens"
ON public.company_oauth_tokens
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = company_oauth_tokens.company_id
    AND cm.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Company admins can insert OAuth tokens"
ON public.company_oauth_tokens
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = company_oauth_tokens.company_id
    AND cm.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Company admins can update OAuth tokens"
ON public.company_oauth_tokens
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = company_oauth_tokens.company_id
    AND cm.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Company admins can delete OAuth tokens"
ON public.company_oauth_tokens
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = company_oauth_tokens.company_id
    AND cm.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_company_oauth_tokens_updated_at
BEFORE UPDATE ON public.company_oauth_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();