-- Table: company_integrations
CREATE TABLE public.company_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  encrypted_credentials TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, integration_type)
);

-- Table: integration_sync_log
CREATE TABLE public.integration_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES company_integrations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL DEFAULT 'manual'::text,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE company_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_integrations
CREATE POLICY "Users can view their company integrations"
  ON company_integrations FOR SELECT
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins and owners can manage company integrations"
  ON company_integrations FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM company_members 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- RLS Policies for integration_sync_log
CREATE POLICY "Users can view sync logs for their company"
  ON integration_sync_log FOR SELECT
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

CREATE POLICY "System can insert sync logs"
  ON integration_sync_log FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- Create updated_at trigger for company_integrations
CREATE TRIGGER update_company_integrations_updated_at
  BEFORE UPDATE ON company_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();