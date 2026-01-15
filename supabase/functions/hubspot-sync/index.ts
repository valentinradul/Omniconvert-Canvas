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
    dealTypeFilter?: 'all' | 'inbound' | 'outbound';
  }
) {
  console.log('Fetching HubSpot deals...');
  console.log('Deal type filter:', options?.dealTypeFilter);
  console.log('Deal type field:', fieldMapping.dealTypeField);
  
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

  let deals = data.results.map((deal: HubSpotDeal) => ({
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

  // Apply deal type filter client-side (HubSpot search doesn't support CONTAINS on all fields)
  const totalBeforeFilter = deals.length;
  if (options?.dealTypeFilter && options.dealTypeFilter !== 'all' && fieldMapping.dealTypeField) {
    deals = deals.filter(deal => {
      if (!deal.dealType) return false;
      const dealTypeLower = deal.dealType.toLowerCase();
      if (options.dealTypeFilter === 'inbound') {
        return dealTypeLower.includes('inbound');
      } else if (options.dealTypeFilter === 'outbound') {
        return dealTypeLower.includes('outbound');
      }
      return true;
    });
    console.log(`Filtered from ${totalBeforeFilter} to ${deals.length} deals by deal type: ${options.dealTypeFilter}`);
  }

  return {
    deals,
    totalCount: data.total || totalBeforeFilter,
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

// Fetch contacts from HubSpot with filters
async function fetchContacts(
  accessToken: string,
  filters: any[],
  properties: string[]
) {
  console.log('Fetching HubSpot contacts with filters:', JSON.stringify(filters));
  
  let allContacts: any[] = [];
  let after: string | undefined;
  
  do {
    const searchBody: any = {
      properties,
      limit: 100,
      filterGroups: filters.length > 0 ? [{ filters }] : undefined,
    };
    
    if (after) {
      searchBody.after = after;
    }
    
    const data = await hubspotFetch(accessToken, '/crm/v3/objects/contacts/search', {
      method: 'POST',
      body: JSON.stringify(searchBody),
    });
    
    allContacts = allContacts.concat(data.results || []);
    after = data.paging?.next?.after;
    
    console.log(`Fetched ${data.results?.length || 0} contacts, total so far: ${allContacts.length}`);
  } while (after);
  
  return allContacts;
}

// Fetch all deals from HubSpot with pagination
async function fetchAllDeals(
  accessToken: string,
  filters: any[],
  properties: string[]
) {
  console.log('Fetching all HubSpot deals with filters:', JSON.stringify(filters));
  
  let allDeals: any[] = [];
  let after: string | undefined;
  
  do {
    const searchBody: any = {
      properties,
      limit: 100,
      filterGroups: filters.length > 0 ? [{ filters }] : undefined,
    };
    
    if (after) {
      searchBody.after = after;
    }
    
    const data = await hubspotFetch(accessToken, '/crm/v3/objects/deals/search', {
      method: 'POST',
      body: JSON.stringify(searchBody),
    });
    
    allDeals = allDeals.concat(data.results || []);
    after = data.paging?.next?.after;
    
    console.log(`Fetched ${data.results?.length || 0} deals, total so far: ${allDeals.length}`);
  } while (after);
  
  return allDeals;
}

// Sync deals to reporting metrics
async function syncDeals(supabase: any, companyId: string, dateFrom?: string, dateTo?: string) {
  console.log('Starting HubSpot sync...', { dateFrom, dateTo });
  
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
    // Get HubSpot metrics from reporting_metrics table
    const { data: hubspotMetrics, error: metricsError } = await supabase
      .from('reporting_metrics')
      .select('id, name, integration_field')
      .eq('company_id', companyId)
      .eq('integration_type', 'hubspot');

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      throw new Error('Failed to fetch HubSpot metrics');
    }

    console.log('Found HubSpot metrics:', hubspotMetrics?.map((m: any) => m.name));

    // Build date filters
    const dateFilters: any[] = [];
    if (dateFrom) {
      dateFilters.push({
        propertyName: 'createdate',
        operator: 'GTE',
        value: new Date(dateFrom).getTime(),
      });
    }
    if (dateTo) {
      dateFilters.push({
        propertyName: 'createdate',
        operator: 'LTE',
        value: new Date(dateTo + 'T23:59:59').getTime(),
      });
    }

    const results: Record<string, number> = {};
    let recordsProcessed = 0;

    // 1. Total MQs: Contacts with lifecycle_stage = MQL, lead_status NOT Disqualified/Unsubscribed
    console.log('Fetching Total MQs...');
    const mqFilters = [
      ...dateFilters,
      {
        propertyName: 'lifecyclestage',
        operator: 'EQ',
        value: 'marketingqualifiedlead',
      },
      {
        propertyName: 'hs_lead_status',
        operator: 'NOT_IN',
        values: ['Disqualified', 'Unsubscribed', 'DISQUALIFIED', 'UNSUBSCRIBED'],
      },
    ];
    
    const mqContacts = await fetchContacts(accessToken, mqFilters, ['lifecyclestage', 'hs_lead_status', 'createdate']);
    results['Total MQs'] = mqContacts.length;
    recordsProcessed += mqContacts.length;
    console.log(`Total MQs: ${mqContacts.length}`);

    // 2. New Clients: Deals in Closed Won stage
    console.log('Fetching New Clients...');
    const closedWonFilters = [
      {
        propertyName: 'dealstage',
        operator: 'EQ',
        value: 'closedwon',
      },
    ];
    
    // Add date filter for closedate for deals
    if (dateFrom) {
      closedWonFilters.push({
        propertyName: 'closedate',
        operator: 'GTE',
        value: new Date(dateFrom).getTime(),
      } as any);
    }
    if (dateTo) {
      closedWonFilters.push({
        propertyName: 'closedate',
        operator: 'LTE',
        value: new Date(dateTo + 'T23:59:59').getTime(),
      } as any);
    }
    
    const closedWonDeals = await fetchAllDeals(accessToken, closedWonFilters, ['dealstage', 'closedate', 'dealname']);
    results['New Clients'] = closedWonDeals.length;
    recordsProcessed += closedWonDeals.length;
    console.log(`New Clients: ${closedWonDeals.length}`);

    // 3. Explore SQLs: Contacts with interest = cro
    console.log('Fetching Explore SQLs...');
    const exploreSqlFilters = [
      ...dateFilters,
      {
        propertyName: 'interests',
        operator: 'CONTAINS_TOKEN',
        value: 'cro',
      },
    ];
    
    const exploreSqlContacts = await fetchContacts(accessToken, exploreSqlFilters, ['interests', 'createdate']);
    results['Explore SQLs'] = exploreSqlContacts.length;
    recordsProcessed += exploreSqlContacts.length;
    console.log(`Explore SQLs: ${exploreSqlContacts.length}`);

    // 4. Reveal SQLs: Contacts with interest = cvo
    console.log('Fetching Reveal SQLs...');
    const revealSqlFilters = [
      ...dateFilters,
      {
        propertyName: 'interests',
        operator: 'CONTAINS_TOKEN',
        value: 'cvo',
      },
    ];
    
    const revealSqlContacts = await fetchContacts(accessToken, revealSqlFilters, ['interests', 'createdate']);
    results['Reveal SQLs'] = revealSqlContacts.length;
    recordsProcessed += revealSqlContacts.length;
    console.log(`Reveal SQLs: ${revealSqlContacts.length}`);

    // 5. Inbound Deals: Deals from contacts with inbound/outbound = inbound
    console.log('Fetching Inbound Deals...');
    // First, fetch all deals and filter by associated contact's inbound/outbound property
    const allDealsFilters = [];
    if (dateFrom) {
      allDealsFilters.push({
        propertyName: 'createdate',
        operator: 'GTE',
        value: new Date(dateFrom).getTime(),
      });
    }
    if (dateTo) {
      allDealsFilters.push({
        propertyName: 'createdate',
        operator: 'LTE',
        value: new Date(dateTo + 'T23:59:59').getTime(),
      });
    }
    
    // Try to filter deals by a deal property for inbound/outbound if it exists
    // Common property names: hs_analytics_source, lead_source, or custom field
    const inboundDeals = await fetchAllDeals(accessToken, allDealsFilters, ['dealname', 'createdate', 'hs_analytics_source']);
    
    // Filter for inbound deals based on analytics source
    const inboundCount = inboundDeals.filter((deal: any) => {
      const source = deal.properties?.hs_analytics_source?.toLowerCase() || '';
      return source.includes('organic') || source.includes('direct') || source.includes('referral') || source.includes('social');
    }).length;
    
    results['Inbound Deals'] = inboundCount;
    recordsProcessed += inboundDeals.length;
    console.log(`Inbound Deals: ${inboundCount}`);

    // Now save these values to reporting_metric_values
    const periodDate = dateFrom || new Date().toISOString().split('T')[0];
    let recordsCreated = 0;
    let recordsUpdated = 0;

    for (const metric of hubspotMetrics || []) {
      const metricName = metric.name;
      const value = results[metricName];
      
      if (value !== undefined) {
        // Check if value exists for this period
        const { data: existingValue } = await supabase
          .from('reporting_metric_values')
          .select('id')
          .eq('metric_id', metric.id)
          .eq('period_date', periodDate)
          .maybeSingle();

        if (existingValue) {
          // Update existing value
          const { error: updateError } = await supabase
            .from('reporting_metric_values')
            .update({
              value: value,
              is_manual_override: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingValue.id);

          if (!updateError) {
            recordsUpdated++;
            console.log(`Updated ${metricName}: ${value}`);
          }
        } else {
          // Insert new value
          const { error: insertError } = await supabase
            .from('reporting_metric_values')
            .insert({
              metric_id: metric.id,
              period_date: periodDate,
              value: value,
              is_manual_override: false,
            });

          if (!insertError) {
            recordsCreated++;
            console.log(`Created ${metricName}: ${value}`);
          }
        }
      }
    }

    // Update sync log
    if (syncLog) {
      await supabase
        .from('integration_sync_log')
        .update({
          status: 'completed',
          records_processed: recordsProcessed,
          records_created: recordsCreated,
          records_updated: recordsUpdated,
          completed_at: new Date().toISOString(),
          details: { results },
        })
        .eq('id', syncLog.id);
    }

    // Update last_sync_at on integration
    await supabase
      .from('company_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id);

    return {
      results,
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
    };
  } catch (error: any) {
    console.error('Sync error:', error);
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
    const { action, companyId, accessToken, useStoredCredentials, config, selectedStages, fieldMapping, dateFrom, dateTo, sortBy, sortOrder, dealTypeFilter } = body;

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
        }, { dateFrom, dateTo, sortBy, sortOrder, dealTypeFilter });
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
        result = await syncDeals(supabase, companyId, dateFrom, dateTo);
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
