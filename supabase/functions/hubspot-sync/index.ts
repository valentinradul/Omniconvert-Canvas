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

    // 1. Total MQLs: Contacts with lifecycle_stage = MQL, inbound_outbound = inbound, lead_status NOT Disqualified/Unsubscribed
    console.log('Fetching Total MQLs...');
    const mqlFilters = [
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
    
    // First try with inbound filter, then fallback to without
    let mqlContacts: any[] = [];
    try {
      // Try with inbound_outbound filter
      const mqlFiltersWithInbound = [
        ...mqlFilters,
        {
          propertyName: 'inbound_outbound',
          operator: 'EQ',
          value: 'Inbound',
        },
      ];
      mqlContacts = await fetchContacts(accessToken, mqlFiltersWithInbound, ['lifecyclestage', 'hs_lead_status', 'inbound_outbound', 'createdate']);
      console.log(`Total MQLs (with Inbound filter): ${mqlContacts.length}`);
      
      // If 0 results, try lowercase
      if (mqlContacts.length === 0) {
        const mqlFiltersWithInboundLower = [
          ...mqlFilters,
          {
            propertyName: 'inbound_outbound',
            operator: 'EQ',
            value: 'inbound',
          },
        ];
        mqlContacts = await fetchContacts(accessToken, mqlFiltersWithInboundLower, ['lifecyclestage', 'hs_lead_status', 'inbound_outbound', 'createdate']);
        console.log(`Total MQLs (with inbound lowercase): ${mqlContacts.length}`);
      }
      
      // If still 0, fallback to without inbound filter
      if (mqlContacts.length === 0) {
        console.log('inbound filter returned 0, falling back to MQL-only filter...');
        mqlContacts = await fetchContacts(accessToken, mqlFilters, ['lifecyclestage', 'hs_lead_status', 'createdate']);
        console.log(`Total MQLs (MQL lifecycle only): ${mqlContacts.length}`);
      }
    } catch (e) {
      console.log('inbound_outbound property error, fetching MQLs without inbound filter...');
      mqlContacts = await fetchContacts(accessToken, mqlFilters, ['lifecyclestage', 'hs_lead_status', 'createdate']);
      console.log(`Total MQLs (fallback): ${mqlContacts.length}`);
    }
    results['Total MQLs'] = mqlContacts.length;
    recordsProcessed += mqlContacts.length;

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
    
    const closedWonDeals = await fetchAllDeals(accessToken, closedWonFilters, ['dealstage', 'closedate', 'dealname', 'amount']);
    results['New Clients (via marketing efforts)'] = closedWonDeals.length;
    // Calculate total revenue from closed won deals
    const totalRevenue = closedWonDeals.reduce((sum: number, deal: any) => {
      const amount = parseFloat(deal.properties?.amount || '0');
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    results['New Revenue (via marketing efforts)'] = totalRevenue;
    recordsProcessed += closedWonDeals.length;
    console.log(`New Clients: ${closedWonDeals.length}, Revenue: ${totalRevenue}`);

    // 3. Explore SQLs: Try to fetch contacts with interest = cro (skip if property doesn't exist)
    console.log('Fetching Explore SQLs...');
    try {
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
    } catch (e) {
      console.log('Explore SQLs fetch failed (interests property may not exist), skipping...');
      results['Explore SQLs'] = 0;
    }

    // 4. Reveal SQLs: Try to fetch contacts with interest = cvo (skip if property doesn't exist)
    console.log('Fetching Reveal SQLs...');
    try {
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
    } catch (e) {
      console.log('Reveal SQLs fetch failed (interests property may not exist), skipping...');
      results['Reveal SQLs'] = 0;
    }

    // 5. Inbound SQLs: Fetch all deals and filter by inbound sources
    console.log('Fetching Inbound Deals...');
    const allDealsFilters: any[] = [];
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
    
    try {
      const inboundDeals = await fetchAllDeals(accessToken, allDealsFilters, ['dealname', 'createdate', 'hs_analytics_source']);
      const inboundCount = inboundDeals.filter((deal: any) => {
        const source = deal.properties?.hs_analytics_source?.toLowerCase() || '';
        return source.includes('organic') || source.includes('direct') || source.includes('referral') || source.includes('social');
      }).length;
      results['Total inbound SQLs (sales reporting)'] = inboundCount;
      recordsProcessed += inboundDeals.length;
      console.log(`Total inbound SQLs: ${inboundCount}`);
    } catch (e) {
      console.log('Inbound deals fetch failed, skipping...');
      results['Total inbound SQLs (sales reporting)'] = 0;
    }

    // 6. Explore Demos booked: Contacts with lead_source = 'book a demo overlay' OR 'book a demo overlay - pas 2'
    console.log('Fetching Explore Demos booked...');
    try {
      const exploreDemoBookedFilters1 = [
        ...dateFilters,
        {
          propertyName: 'hs_lead_status',
          operator: 'NEQ',
          value: 'DISQUALIFIED',
        },
        {
          propertyName: 'hs_lead_status',
          operator: 'NEQ',
          value: 'UNSUBSCRIBED',
        },
        {
          propertyName: 'hs_latest_source',
          operator: 'EQ',
          value: 'book a demo overlay',
        },
      ];
      const exploreDemoBookedFilters2 = [
        ...dateFilters,
        {
          propertyName: 'hs_lead_status',
          operator: 'NEQ',
          value: 'DISQUALIFIED',
        },
        {
          propertyName: 'hs_lead_status',
          operator: 'NEQ',
          value: 'UNSUBSCRIBED',
        },
        {
          propertyName: 'hs_latest_source',
          operator: 'EQ',
          value: 'book a demo overlay - pas 2',
        },
      ];
      const exploreDemoBooked1 = await fetchContacts(accessToken, exploreDemoBookedFilters1, ['hs_latest_source', 'createdate']);
      const exploreDemoBooked2 = await fetchContacts(accessToken, exploreDemoBookedFilters2, ['hs_latest_source', 'createdate']);
      results['Explore Demos booked (SQLs only)'] = exploreDemoBooked1.length + exploreDemoBooked2.length;
      recordsProcessed += exploreDemoBooked1.length + exploreDemoBooked2.length;
      console.log(`Explore Demos booked: ${exploreDemoBooked1.length + exploreDemoBooked2.length}`);
    } catch (e) {
      console.log('Explore Demos booked fetch failed, trying alternative property names...');
      try {
        // Try with lead_source property instead
        const altFilters1 = [
          ...dateFilters,
          { propertyName: 'lead_source', operator: 'EQ', value: 'book a demo overlay' },
        ];
        const altFilters2 = [
          ...dateFilters,
          { propertyName: 'lead_source', operator: 'EQ', value: 'book a demo overlay - pas 2' },
        ];
        const alt1 = await fetchContacts(accessToken, altFilters1, ['lead_source', 'createdate']);
        const alt2 = await fetchContacts(accessToken, altFilters2, ['lead_source', 'createdate']);
        results['Explore Demos booked (SQLs only)'] = alt1.length + alt2.length;
        recordsProcessed += alt1.length + alt2.length;
        console.log(`Explore Demos booked (alt): ${alt1.length + alt2.length}`);
      } catch (e2) {
        console.log('Explore Demos booked fetch failed completely, setting to 0');
        results['Explore Demos booked (SQLs only)'] = 0;
      }
    }

    // 7. Reveal Demos booked: Contacts with lead_source = 'book a demo overlay pricing Reveal - pas 2'
    console.log('Fetching Reveal Demos booked...');
    try {
      const revealDemoBookedFilters = [
        ...dateFilters,
        {
          propertyName: 'hs_lead_status',
          operator: 'NEQ',
          value: 'DISQUALIFIED',
        },
        {
          propertyName: 'hs_lead_status',
          operator: 'NEQ',
          value: 'UNSUBSCRIBED',
        },
        {
          propertyName: 'hs_latest_source',
          operator: 'EQ',
          value: 'book a demo overlay pricing Reveal - pas 2',
        },
      ];
      const revealDemoBooked = await fetchContacts(accessToken, revealDemoBookedFilters, ['hs_latest_source', 'createdate']);
      results['Reveal Demos booked (SQLs only)'] = revealDemoBooked.length;
      recordsProcessed += revealDemoBooked.length;
      console.log(`Reveal Demos booked: ${revealDemoBooked.length}`);
    } catch (e) {
      console.log('Reveal Demos booked fetch failed, trying alternative property...');
      try {
        const altFilters = [
          ...dateFilters,
          { propertyName: 'lead_source', operator: 'EQ', value: 'book a demo overlay pricing Reveal - pas 2' },
        ];
        const alt = await fetchContacts(accessToken, altFilters, ['lead_source', 'createdate']);
        results['Reveal Demos booked (SQLs only)'] = alt.length;
        recordsProcessed += alt.length;
        console.log(`Reveal Demos booked (alt): ${alt.length}`);
      } catch (e2) {
        console.log('Reveal Demos booked fetch failed completely, setting to 0');
        results['Reveal Demos booked (SQLs only)'] = 0;
      }
    }

    // 8. Explore Demos held: Deals with deal stage = 'Demo held (Saas)'
    console.log('Fetching Explore Demos held...');
    try {
      const exploreDemoHeldFilters: any[] = [
        {
          propertyName: 'dealstage',
          operator: 'EQ',
          value: 'Demo held (Saas)',
        },
      ];
      if (dateFrom) {
        exploreDemoHeldFilters.push({
          propertyName: 'createdate',
          operator: 'GTE',
          value: new Date(dateFrom).getTime(),
        });
      }
      if (dateTo) {
        exploreDemoHeldFilters.push({
          propertyName: 'createdate',
          operator: 'LTE',
          value: new Date(dateTo + 'T23:59:59').getTime(),
        });
      }
      const exploreDemoHeld = await fetchAllDeals(accessToken, exploreDemoHeldFilters, ['dealstage', 'createdate', 'dealname']);
      results['Explore Demos held (SQLs only)'] = exploreDemoHeld.length;
      recordsProcessed += exploreDemoHeld.length;
      console.log(`Explore Demos held: ${exploreDemoHeld.length}`);
    } catch (e) {
      console.log('Explore Demos held fetch failed, setting to 0');
      results['Explore Demos held (SQLs only)'] = 0;
    }

    // 9. Reveal Demos held: Deals with deal stage = 'Discovery held (Saas)'
    console.log('Fetching Reveal Demos held...');
    try {
      const revealDemoHeldFilters: any[] = [
        {
          propertyName: 'dealstage',
          operator: 'EQ',
          value: 'Discovery held (Saas)',
        },
      ];
      if (dateFrom) {
        revealDemoHeldFilters.push({
          propertyName: 'createdate',
          operator: 'GTE',
          value: new Date(dateFrom).getTime(),
        });
      }
      if (dateTo) {
        revealDemoHeldFilters.push({
          propertyName: 'createdate',
          operator: 'LTE',
          value: new Date(dateTo + 'T23:59:59').getTime(),
        });
      }
      const revealDemoHeld = await fetchAllDeals(accessToken, revealDemoHeldFilters, ['dealstage', 'createdate', 'dealname']);
      results['Reveal Demos held (SQLs only)'] = revealDemoHeld.length;
      recordsProcessed += revealDemoHeld.length;
      console.log(`Reveal Demos held: ${revealDemoHeld.length}`);
    } catch (e) {
      console.log('Reveal Demos held fetch failed, setting to 0');
      results['Reveal Demos held (SQLs only)'] = 0;
    }

    // Log all results for debugging
    console.log('All results:', JSON.stringify(results));

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
    
    // Create Supabase client with service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, companyId, accessToken, useStoredCredentials, config, selectedStages, fieldMapping, dateFrom, dateTo, sortBy, sortOrder, dealTypeFilter } = body;

    console.log(`HubSpot sync action: ${action} for company: ${companyId}`);

    // For sync action with stored credentials, we don't require user auth
    // We validate by checking if the company has an active HubSpot integration
    const authHeader = req.headers.get('Authorization');
    let user = null;
    
    if (authHeader) {
      // If auth header provided, verify the JWT token
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && authUser) {
        user = authUser;
        
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
      }
    }
    
    // For sync action without auth, validate by checking integration exists
    if (!user && action === 'sync') {
      const { data: integration, error: integrationError } = await supabase
        .from('company_integrations')
        .select('id, encrypted_credentials')
        .eq('company_id', companyId)
        .eq('integration_type', 'hubspot')
        .eq('is_active', true)
        .maybeSingle();

      if (integrationError || !integration || !integration.encrypted_credentials) {
        return new Response(
          JSON.stringify({ error: 'No active HubSpot integration found for this company' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Sync authorized via stored integration credentials');
    } else if (!user && action !== 'sync') {
      // Other actions require auth
      return new Response(
        JSON.stringify({ error: 'Authentication required for this action' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the access token to use
    let tokenToUse = accessToken;
    if (!accessToken) {
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
