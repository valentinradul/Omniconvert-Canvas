import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Metric mappings: reporting_metrics name -> GA4 query config
const GA_METRIC_MAPPINGS: Record<string, { 
  metric: string; 
  pageFilter?: string;
  pageFilterType?: 'contains' | 'exact';
}> = {
  'Total Traffic (Users)': { metric: 'totalUsers' },
  'Pricing (users)': { metric: 'totalUsers', pageFilter: '/pricing', pageFilterType: 'contains' },
  'Book-a-demo': { metric: 'totalUsers', pageFilter: '/book-a-demo', pageFilterType: 'contains' },
  'Book-a-call': { metric: 'totalUsers', pageFilter: '/book-a-call', pageFilterType: 'contains' },
  'Pricing Explore': { metric: 'totalUsers', pageFilter: '/pricing/explore', pageFilterType: 'contains' },
  'Pricing Reveal': { metric: 'totalUsers', pageFilter: '/pricing/reveal', pageFilterType: 'contains' },
  'Pricing Pulse': { metric: 'totalUsers', pageFilter: '/pricing/pulse', pageFilterType: 'contains' },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, companyId, config, startDate, endDate } = body;
    
    console.log('Request received:', { action, companyId, hasConfig: !!config });

    // Validate action is provided
    if (!action) {
      console.error('No action provided in request body:', JSON.stringify(body));
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No action specified. Valid actions: get-properties, save-config, sync, disconnect' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Helper: Get valid access token (with refresh if needed)
    const getValidAccessToken = async (companyIdParam: string): Promise<string> => {
      const { data: oauthToken, error: oauthError } = await supabase
        .from('company_oauth_tokens')
        .select('id, access_token, refresh_token, token_expires_at')
        .eq('company_id', companyIdParam)
        .eq('provider', 'google_analytics')
        .maybeSingle();

      if (oauthError || !oauthToken) {
        throw new Error('Google Analytics not connected. Please reconnect in Settings → Integrations.');
      }

      const now = new Date();
      const expiresAt = oauthToken.token_expires_at ? new Date(oauthToken.token_expires_at) : null;
      const needsRefresh = !expiresAt || expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

      if (!needsRefresh) {
        console.log('Token still valid');
        return oauthToken.access_token;
      }

      console.log('Refreshing access token...');
      
      if (!oauthToken.refresh_token) {
        throw new Error('No refresh token. Please reconnect Google Analytics.');
      }

      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        throw new Error('Google OAuth not configured on server.');
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: oauthToken.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('Token refresh failed:', errorData);
        throw new Error('Token expired. Please reconnect Google Analytics.');
      }

      const tokenData = await tokenResponse.json();
      const newExpiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

      await supabase
        .from('company_oauth_tokens')
        .update({
          access_token: tokenData.access_token,
          token_expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', oauthToken.id);

      console.log('Token refreshed successfully');
      return tokenData.access_token;
    };

    // Helper: Fetch GA4 report
    const fetchGAReport = async (
      propertyId: string, 
      accessToken: string, 
      dateRange: { startDate: string; endDate: string },
      metricName: string,
      pageFilter?: string,
      pageFilterType?: 'contains' | 'exact'
    ): Promise<Record<string, number>> => {
      const requestBody: Record<string, unknown> = {
        dateRanges: [dateRange],
        metrics: [{ name: metricName }],
        dimensions: [{ name: 'date' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      };

      if (pageFilter) {
        requestBody.dimensionFilter = {
          filter: {
            fieldName: 'pagePath',
            stringFilter: {
              matchType: pageFilterType === 'exact' ? 'EXACT' : 'CONTAINS',
              value: pageFilter,
            },
          },
        };
      }

      const response = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GA API error:', errorText);
        throw new Error(`GA API error: ${response.status}`);
      }

      const data = await response.json();
      const result: Record<string, number> = {};

      for (const row of data.rows || []) {
        const dateValue = row.dimensionValues[0].value; // YYYYMMDD
        const formattedDate = `${dateValue.slice(0, 4)}-${dateValue.slice(4, 6)}-${dateValue.slice(6, 8)}`;
        result[formattedDate] = parseInt(row.metricValues[0]?.value || '0');
      }

      return result;
    };

    switch (action) {
      case 'test-connection': {
        const { propertyId, accessToken } = config;
        
        const response = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
              metrics: [{ name: 'sessions' }],
              dimensions: [{ name: 'date' }],
              limit: 1,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('GA test failed:', errorText);
          return new Response(JSON.stringify({ success: false, error: 'Connection test failed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-properties': {
        const { accessToken } = config;
        
        const response = await fetch(
          'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (!response.ok) {
          return new Response(JSON.stringify({ success: false, error: 'Failed to fetch properties' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const data = await response.json();
        const properties: { id: string; name: string; account: string }[] = [];
        
        for (const account of data.accountSummaries || []) {
          for (const property of account.propertySummaries || []) {
            properties.push({
              id: property.property.replace('properties/', ''),
              name: property.displayName,
              account: account.displayName,
            });
          }
        }

        return new Response(JSON.stringify({ success: true, properties }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'sync': {
        console.log('Starting sync for company:', companyId);

        if (!companyId) {
          return new Response(JSON.stringify({ success: false, error: 'companyId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get integration config for property ID
        const { data: integration, error: intError } = await supabase
          .from('company_integrations')
          .select('id, config')
          .eq('company_id', companyId)
          .eq('integration_type', 'google_analytics')
          .eq('is_active', true)
          .maybeSingle();

        if (intError) {
          console.error('Integration lookup error:', intError);
          return new Response(JSON.stringify({ success: false, error: 'Failed to load integration config' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!integration) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Google Analytics not configured. Go to Settings → Integrations to set up.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const integrationConfig = integration.config as { propertyId?: string } | null;
        const propertyId = integrationConfig?.propertyId;

        if (!propertyId) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No GA property configured. Click Configure in Settings → Integrations.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get access token
        let accessToken: string;
        try {
          accessToken = await getValidAccessToken(companyId);
        } catch (tokenError) {
          console.error('Token error:', tokenError);
          return new Response(JSON.stringify({ 
            success: false, 
            error: tokenError instanceof Error ? tokenError.message : 'Token error' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get all GA-sourced metrics from reporting_metrics
        const { data: gaMetrics, error: metricsError } = await supabase
          .from('reporting_metrics')
          .select('id, name')
          .eq('company_id', companyId)
          .eq('source', 'Google Analytics');

        if (metricsError) {
          console.error('Failed to fetch metrics:', metricsError);
          return new Response(JSON.stringify({ success: false, error: 'Failed to load metrics' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log(`Found ${gaMetrics?.length || 0} GA metrics to sync`);

        // Calculate date range (last 3 months)
        const endDateObj = new Date();
        const startDateObj = new Date();
        startDateObj.setMonth(startDateObj.getMonth() - 3);

        const dateRange = {
          startDate: startDate || startDateObj.toISOString().split('T')[0],
          endDate: endDate || endDateObj.toISOString().split('T')[0],
        };

        console.log('Date range:', dateRange);

        let recordsProcessed = 0;
        const syncedMetrics: string[] = [];

        // Process each metric
        for (const metric of gaMetrics || []) {
          const mapping = GA_METRIC_MAPPINGS[metric.name];
          
          if (!mapping) {
            console.log(`No mapping for metric: ${metric.name}`);
            continue;
          }

          console.log(`Syncing metric: ${metric.name}`);

          try {
            const values = await fetchGAReport(
              propertyId,
              accessToken,
              dateRange,
              mapping.metric,
              mapping.pageFilter,
              mapping.pageFilterType
            );

            // Upsert values to reporting_metric_values
            for (const [periodDate, value] of Object.entries(values)) {
              const { error: upsertError } = await supabase
                .from('reporting_metric_values')
                .upsert({
                  metric_id: metric.id,
                  period_date: periodDate,
                  value: value,
                  is_manual_override: false,
                  updated_at: new Date().toISOString(),
                }, {
                  onConflict: 'metric_id,period_date',
                });

              if (upsertError) {
                console.error(`Failed to upsert value for ${metric.name} on ${periodDate}:`, upsertError);
              } else {
                recordsProcessed++;
              }
            }

            syncedMetrics.push(metric.name);
          } catch (metricError) {
            console.error(`Failed to sync metric ${metric.name}:`, metricError);
          }
        }

        // Handle "Pricing + Book a demo (Users)" - calculated as sum
        const combinedMetric = gaMetrics?.find(m => m.name === 'Pricing + Book a demo (Users)');
        if (combinedMetric) {
          console.log('Calculating combined metric: Pricing + Book a demo');
          
          try {
            const pricingValues = await fetchGAReport(propertyId, accessToken, dateRange, 'totalUsers', '/pricing', 'contains');
            const demoValues = await fetchGAReport(propertyId, accessToken, dateRange, 'totalUsers', '/book-a-demo', 'contains');

            const allDates = new Set([...Object.keys(pricingValues), ...Object.keys(demoValues)]);
            
            for (const periodDate of allDates) {
              const combinedValue = (pricingValues[periodDate] || 0) + (demoValues[periodDate] || 0);
              
              const { error: upsertError } = await supabase
                .from('reporting_metric_values')
                .upsert({
                  metric_id: combinedMetric.id,
                  period_date: periodDate,
                  value: combinedValue,
                  is_manual_override: false,
                  updated_at: new Date().toISOString(),
                }, {
                  onConflict: 'metric_id,period_date',
                });

              if (!upsertError) recordsProcessed++;
            }

            syncedMetrics.push(combinedMetric.name);
          } catch (combinedError) {
            console.error('Failed to sync combined metric:', combinedError);
          }
        }

        // Update last_sync_at
        await supabase
          .from('company_integrations')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', integration.id);

        // Create sync log
        await supabase
          .from('integration_sync_log')
          .insert({
            company_id: companyId,
            integration_id: integration.id,
            sync_type: 'manual',
            status: 'completed',
            records_processed: recordsProcessed,
            completed_at: new Date().toISOString(),
            details: { metrics_synced: syncedMetrics },
          });

        console.log(`Sync completed: ${recordsProcessed} records, ${syncedMetrics.length} metrics`);

        return new Response(JSON.stringify({ 
          success: true, 
          recordsProcessed,
          metricsSynced: syncedMetrics,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'disconnect': {
        if (!companyId) {
          return new Response(JSON.stringify({ success: false, error: 'companyId required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await supabase
          .from('company_integrations')
          .update({ is_active: false })
          .eq('company_id', companyId)
          .eq('integration_type', 'google_analytics');

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
