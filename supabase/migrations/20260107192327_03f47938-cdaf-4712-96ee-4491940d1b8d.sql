-- Create marketing_campaign_metrics table for Meta Ads and future ad channels
CREATE TABLE public.marketing_campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  channel_source TEXT NOT NULL DEFAULT 'Meta',
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  date_reported DATE NOT NULL,
  spend NUMERIC DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  cpm NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_synced_at TIMESTAMPTZ,
  UNIQUE(company_id, campaign_id, date_reported, channel_source)
);

-- Enable RLS
ALTER TABLE public.marketing_campaign_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Company members can view campaign metrics"
ON public.marketing_campaign_metrics
FOR SELECT
USING (user_has_company_access(auth.uid(), company_id));

CREATE POLICY "Company admins can manage campaign metrics"
ON public.marketing_campaign_metrics
FOR ALL
USING (user_has_company_admin_role(auth.uid(), company_id))
WITH CHECK (user_has_company_admin_role(auth.uid(), company_id));

CREATE POLICY "Super admins can manage all campaign metrics"
ON public.marketing_campaign_metrics
FOR ALL
USING (is_super_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_marketing_campaign_metrics_updated_at
BEFORE UPDATE ON public.marketing_campaign_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();