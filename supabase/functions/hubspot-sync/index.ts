import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HubSpotConfig {
  pipelines: string[];
  selectedStages: string[];
  stageMapping: StageMapping[];
  fieldMapping: FieldMapping;
}

interface StageMapping {
  stageId: string;
  stageName: string;
  targetMetricId?: string;
  includeInSync: boolean;
}

interface FieldMapping {
  clientNameField: string;
  amountField: string;
  closeDateField: string;
  countryField?: string;
  dealTypeField?: string; // For inbound/outbound classification
}

interface HubSpotDeal {
  id: string;
  properties: Record<string, string | null>;
}

// Helper to get stored credentials
async function getStoredCredentials(supabase: any, companyId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('company_integrations')
    .select('encrypted_credentials')
    .eq('company_id', companyId)
    .eq('integration_type', 'hubspot')
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching credentials:', error);
    return null;
  }

  return data.encrypted_credentials;
}

// Helper to make HubSpot API calls
async function hubspotFetch(accessToken: string, endpoint: string, options: RequestInit = {}) {
  const url = `https://api.hubapi.com${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`HubSpot API error: ${response.status} - ${errorText}`);
    throw new Error(`HubSpot API error: ${response.status}`);
  }

  return response.json();
}

// Get HubSpot pipelines
async function getPipelines(accessToken: string) {
  console.log('Fetching HubSpot pipelines...');
  const data = await hubspotFetch(accessToken, '/crm/v3/pipelines/deals');
  
  console.log(`Found ${data.results.length} pipelines:`);
  data.results.forEach((pipeline: any) => {
    console.log(`  - Pipeline: "${pipeline.label}" (ID: ${pipeline.id}) with ${pipeline.stages?.length || 0} stages`);
  });
  
  return data.results.map((pipeline: any) => ({
    id: pipeline.id,
    label: pipeline.label,
    stages: pipeline.stages.map((stage: any) => ({
      id: stage.id,
      label: stage.label,
    })),
  }));
}

// Get HubSpot deal properties
async function getDealProperties(accessToken: string) {
  console.log('Fetching HubSpot deal properties...');
  const data = await hubspotFetch(accessToken, '/crm/v3/properties/deals');
  
  return data.results.map((prop: any) => ({
    name: prop.name,
    label: prop.label,
    type: prop.type,
    fieldType: prop.fieldType,
  }));
}

// Fetch deals from HubSpot
async function fetchDeals(
  accessToken: string,
  selectedStages: string[],
  fieldMapping: FieldMapping,
  options?: {
    dateFrom?: string | null;
    dateTo?: string | null;
    sortBy?: 'closeDate' | 'amount' | 'name';
    sortOrder?: 'asc' | 'desc';
  }
) {
  console.log('Fetching HubSpot deals...');
  
  const properties = [
    'dealname',
    'amount',
    'closedate',
    'dealstage',
    'pipeline',
    fieldMapping.clientNameField,
    fieldMapping.amountField,
    fieldMapping.closeDateField,
    fieldMapping.countryField,
    fieldMapping.dealTypeField,
  ].filter(Boolean);

  // Build filters
  const filters: any[] = [];
  
  if (selectedStages.length > 0) {
    filters.push({
      propertyName: 'dealstage',
      operator: 'IN',
      values: selectedStages,
    });
  }

  if (options?.dateFrom) {
    filters.push({
      propertyName: 'closedate',
      operator: 'GTE',
      value: new Date(options.dateFrom).getTime(),
    });
  }

  if (options?.dateTo) {
    filters.push({
      propertyName: 'closedate',
      operator: 'LTE',
      value: new Date(options.dateTo).getTime(),
    });
  }

  const sortDirection = options?.sortOrder === 'asc' ? 'ASCENDING' : 'DESCENDING';
  
  const searchBody: any = {
    properties,
    limit: 100,
    sorts: [{
      propertyName: options?.sortBy === 'name' ? 'dealname' : 
                    options?.sortBy === 'amount' ? 'amount' : 'closedate',
      direction: sortDirection,
    }],
  };

  if (filters.length > 0) {
    searchBody.filterGroups = [{ filters }];
  }

  const data = await hubspotFetch(accessToken, '/crm/v3/objects/deals/search', {
    method: 'POST',
    body: JSON.stringify(searchBody),
  });

  const deals = data.results.map((deal: HubSpotDeal) => ({
    id: deal.id,
    name: deal.properties.dealname || deal.properties[fieldMapping.clientNameField] || 'Unnamed Deal',
    amount: parseFloat(deal.properties[fieldMapping.amountField] || deal.properties.amount || '0'),
    closeDate: deal.properties[fieldMapping.closeDateField] || deal.properties.closedate,
    stageId: deal.properties.dealstage,
    pipelineId: deal.properties.pipeline,
    forecastCategory: deal.properties.hs_forecast_category || null,
    dealType: fieldMapping.dealTypeField ? deal.properties[fieldMapping.dealTypeField] : null,
    rawProperties: deal.properties,
  }));

  return {
    deals,
    totalCount: data.total || deals.length,
    filteredCount: deals.length,
  };
}

// Save configuration
async function saveConfiguration(
  supabase: any,
  companyId: string,
  accessToken: string | undefined,
  useStoredCredentials: boolean,
  config: HubSpotConfig
) {
  console.log('Saving HubSpot configuration...');
  
  let credentialsToStore = accessToken;
  
  if (useStoredCredentials && !accessToken) {
    credentialsToStore = await getStoredCredentials(supabase, companyId);
  }

  const { error } = await supabase
    .from('company_integrations')
    .upsert({
      company_id: companyId,
      integration_type: 'hubspot',
      config: config,
      encrypted_credentials: credentialsToStore,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'company_id,integration_type',
    });

  if (error) {
    console.error('Error saving config:', error);
    throw new Error('Failed to save configuration');
  }

  return { success: true };
}

// Sync deals to reporting metrics
async function syncDeals(supabase: any, companyId: string) {
  console.log('Starting HubSpot sync...');
  
  // Get integration config
  const { data: integration, error: integrationError } = await supabase
    .from('company_integrations')
    .select('*')
    .eq('company_id', companyId)
    .eq('integration_type', 'hubspot')
    .maybeSingle();

  if (integrationError || !integration) {
    throw new Error('HubSpot integration not configured');
  }

  const accessToken = integration.encrypted_credentials;
  const config = integration.config as HubSpotConfig;

  if (!accessToken) {
    throw new Error('No access token found');
  }

  // Create sync log entry
  const { data: syncLog, error: syncLogError } = await supabase
    .from('integration_sync_log')
    .insert({
      integration_id: integration.id,
      company_id: companyId,
      sync_type: 'manual',
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (syncLogError) {
    console.error('Error creating sync log:', syncLogError);
  }

  try {
    // Fetch deals from HubSpot
    const { deals } = await fetchDeals(
      accessToken,
      config.selectedStages,
      config.fieldMapping
    );

    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;

    // Process each deal based on stage mapping
    for (const deal of deals) {
      const stageMapping = config.stageMapping.find(m => m.stageId === deal.stageId);
      
      if (!stageMapping || !stageMapping.includeInSync) {
        recordsSkipped++;
        continue;
      }

      // Here you would implement the actual sync logic to your reporting metrics
      // This is a placeholder that logs the deal
      console.log(`Processing deal: ${deal.name}, Amount: ${deal.amount}, Stage: ${deal.stageId}`);
      
      // For now, just count as processed
      recordsCreated++;
    }

    // Update sync log
    if (syncLog) {
      await supabase
        .from('integration_sync_log')
        .update({
          status: 'completed',
          records_processed: deals.length,
          records_created: recordsCreated,
          records_updated: recordsUpdated,
          completed_at: new Date().toISOString(),
          details: { recordsSkipped },
        })
        .eq('id', syncLog.id);
    }

    // Update last_sync_at on integration
    await supabase
      .from('company_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id);

    return {
      dealsProcessed: deals.length,
      recordsCreated,
      recordsUpdated,
      recordsSkipped,
    };
  } catch (error: any) {
    // Update sync log with error
    if (syncLog) {
      await supabase
        .from('integration_sync_log')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id);
    }
    throw error;
  }
}

// Disconnect integration
async function disconnectIntegration(supabase: any, companyId: string) {
  console.log('Disconnecting HubSpot integration...');
  
  const { error } = await supabase
    .from('company_integrations')
    .delete()
    .eq('company_id', companyId)
    .eq('integration_type', 'hubspot');

  if (error) {
    console.error('Error disconnecting:', error);
    throw new Error('Failed to disconnect integration');
  }

  return { success: true };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, companyId, accessToken, useStoredCredentials, config, selectedStages, fieldMapping, dateFrom, dateTo, sortBy, sortOrder } = body;

    console.log(`HubSpot sync action: ${action} for company: ${companyId}`);

    // Verify user has access to this company
    const { data: membership, error: membershipError } = await supabase
      .from('company_members')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: 'Access denied to this company' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the access token to use
    let tokenToUse = accessToken;
    if (useStoredCredentials && !accessToken) {
      tokenToUse = await getStoredCredentials(supabase, companyId);
    }

    let result;

    switch (action) {
      case 'get-pipelines':
        if (!tokenToUse) {
          return new Response(
            JSON.stringify({ error: 'No access token available' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const pipelines = await getPipelines(tokenToUse);
        result = { pipelines };
        break;

      case 'get-deal-properties':
        if (!tokenToUse) {
          return new Response(
            JSON.stringify({ error: 'No access token available' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const properties = await getDealProperties(tokenToUse);
        result = { properties };
        break;

      case 'fetch-deals':
        if (!tokenToUse) {
          return new Response(
            JSON.stringify({ error: 'No access token available' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await fetchDeals(tokenToUse, selectedStages || [], fieldMapping || {
          clientNameField: 'dealname',
          amountField: 'amount',
          closeDateField: 'closedate',
        }, { dateFrom, dateTo, sortBy, sortOrder });
        break;

      case 'save-config':
        if (!config) {
          return new Response(
            JSON.stringify({ error: 'Config required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Check admin/owner permission
        if (!['admin', 'owner'].includes(membership.role)) {
          return new Response(
            JSON.stringify({ error: 'Admin or owner role required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await saveConfiguration(supabase, companyId, accessToken, useStoredCredentials, config);
        break;

      case 'sync':
        result = await syncDeals(supabase, companyId);
        break;

      case 'disconnect':
        // Check admin/owner permission
        if (!['admin', 'owner'].includes(membership.role)) {
          return new Response(
            JSON.stringify({ error: 'Admin or owner role required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await disconnectIntegration(supabase, companyId);
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('HubSpot sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
