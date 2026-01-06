-- GTM Calculator Database Tables
-- Outreach Campaigns (email + LinkedIn)

CREATE TABLE IF NOT EXISTS public.gtm_outreach_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),

  -- Campaign Timeline
  start_date date,
  end_date date,
  status text DEFAULT 'Draft' CHECK (status IN ('Draft', 'Scheduled', 'Running', 'Paused', 'Completed')),
  notes text,
  tags text[],

  -- Channel Configuration
  email_enabled boolean DEFAULT true,
  linkedin_enabled boolean DEFAULT true,

  -- Targeting
  targeted_companies integer DEFAULT 30000,
  contacts_per_company integer DEFAULT 4,
  emails_per_contact integer DEFAULT 5,
  campaign_duration integer DEFAULT 30,
  follow_up_interval integer DEFAULT 3,

  -- Funnel Rates
  meeting_rate numeric DEFAULT 1,
  opportunity_conversion_rate numeric DEFAULT 45,
  closing_rate numeric DEFAULT 5,
  revenue_per_customer numeric DEFAULT 10000,

  -- Email Costs
  email_agency_cost numeric DEFAULT 0,
  email_internal_cost numeric DEFAULT 0,
  email_tech_cost numeric DEFAULT 0,

  -- LinkedIn Costs
  linkedin_agency_cost numeric DEFAULT 0,
  linkedin_internal_cost numeric DEFAULT 0,
  linkedin_tech_cost numeric DEFAULT 0,

  -- Calculated Fields (stored for reporting)
  total_contacts integer,
  total_cost numeric,
  revenue numeric,
  roi numeric,
  customers numeric,

  -- Actual Results
  actual_emails_sent integer,
  actual_meetings_booked integer,
  actual_opportunities integer,
  actual_deals integer,
  actual_revenue numeric,
  actual_cost numeric
);

-- Enable RLS
ALTER TABLE public.gtm_outreach_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gtm_outreach_campaigns
CREATE POLICY "Users can view own outreach campaigns"
  ON public.gtm_outreach_campaigns
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR (company_id IS NOT NULL AND user_has_company_access(auth.uid(), company_id))
  );

CREATE POLICY "Users can insert outreach campaigns"
  ON public.gtm_outreach_campaigns
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (company_id IS NULL OR user_has_company_access(auth.uid(), company_id))
  );

CREATE POLICY "Users can update own outreach campaigns"
  ON public.gtm_outreach_campaigns
  FOR UPDATE
  USING (
    user_id = auth.uid() 
    OR (company_id IS NOT NULL AND user_has_company_access(auth.uid(), company_id))
  );

CREATE POLICY "Users can delete own outreach campaigns"
  ON public.gtm_outreach_campaigns
  FOR DELETE
  USING (
    user_id = auth.uid() 
    OR (company_id IS NOT NULL AND user_has_company_access(auth.uid(), company_id))
  );

-- Ad Campaigns Table
CREATE TABLE IF NOT EXISTS public.gtm_ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),

  -- Campaign Timeline
  start_date date,
  end_date date,
  status text DEFAULT 'Draft' CHECK (status IN ('Draft', 'Scheduled', 'Running', 'Paused', 'Completed')),
  notes text,
  tags text[],

  -- Channel
  channel text NOT NULL,

  -- Costs
  agency_cost numeric DEFAULT 0,
  creative_cost numeric DEFAULT 0,
  media_cost numeric DEFAULT 0,

  -- Funnel Metrics
  cpc numeric DEFAULT 2,
  target_cost_per_signup numeric DEFAULT 50,
  signup_to_customer_rate numeric DEFAULT 7,
  revenue_per_customer numeric DEFAULT 9,
  transactions_per_customer numeric DEFAULT 2,

  -- Calculated Fields
  clicks integer,
  signups integer,
  total_cost numeric,
  cost_per_signup numeric,
  conversion_rate numeric,
  paid_customers integer,
  cac numeric,
  captured_revenue numeric,
  total_revenue numeric,
  roas numeric,

  -- Actual Results
  actual_agency_cost numeric,
  actual_creative_cost numeric,
  actual_media_cost numeric,
  actual_clicks integer,
  actual_signups integer,
  actual_paid_customers integer,
  actual_revenue numeric
);

-- Enable RLS
ALTER TABLE public.gtm_ad_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gtm_ad_campaigns
CREATE POLICY "Users can view own ad campaigns"
  ON public.gtm_ad_campaigns
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR (company_id IS NOT NULL AND user_has_company_access(auth.uid(), company_id))
  );

CREATE POLICY "Users can insert ad campaigns"
  ON public.gtm_ad_campaigns
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (company_id IS NULL OR user_has_company_access(auth.uid(), company_id))
  );

CREATE POLICY "Users can update own ad campaigns"
  ON public.gtm_ad_campaigns
  FOR UPDATE
  USING (
    user_id = auth.uid() 
    OR (company_id IS NOT NULL AND user_has_company_access(auth.uid(), company_id))
  );

CREATE POLICY "Users can delete own ad campaigns"
  ON public.gtm_ad_campaigns
  FOR DELETE
  USING (
    user_id = auth.uid() 
    OR (company_id IS NOT NULL AND user_has_company_access(auth.uid(), company_id))
  );

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_gtm_outreach_user_id ON public.gtm_outreach_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_gtm_outreach_company_id ON public.gtm_outreach_campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_gtm_outreach_status ON public.gtm_outreach_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_gtm_outreach_created_at ON public.gtm_outreach_campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gtm_ad_user_id ON public.gtm_ad_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_gtm_ad_company_id ON public.gtm_ad_campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_gtm_ad_status ON public.gtm_ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_gtm_ad_channel ON public.gtm_ad_campaigns(channel);
CREATE INDEX IF NOT EXISTS idx_gtm_ad_created_at ON public.gtm_ad_campaigns(created_at DESC);