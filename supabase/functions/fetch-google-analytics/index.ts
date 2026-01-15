import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleAnalyticsConfig {
  propertyId: string;
  accessToken: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  selectedMetrics: string[];
  dateRangeMonths: number;
}

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

    const { action, companyId, config, startDate, endDate, metricIds } = await req.json();

    switch (action) {
      case 'test-connection': {
        const { propertyId, accessToken } = config as GoogleAnalyticsConfig;
        
        // Test connection by fetching property metadata
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
          console.error('Google Analytics API error:', errorText);
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Failed to connect to Google Analytics. Please check your credentials.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-properties': {
        const { accessToken } = config as GoogleAnalyticsConfig;
        
        // Get account summaries to list properties
        const response = await fetch(
          'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch properties:', errorText);
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Failed to fetch properties' 
          }), {
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

      case 'save-config': {
        const gaConfig = config as GoogleAnalyticsConfig;
        
        // Check if integration already exists
        const { data: existing } = await supabase
          .from('company_integrations')
          .select('id')
          .eq('company_id', companyId)
          .eq('integration_type', 'google_analytics')
          .single();

        const integrationData = {
          company_id: companyId,
          integration_type: 'google_analytics',
          is_active: true,
          config: {
            property_id: gaConfig.propertyId,
            selected_metrics: gaConfig.selectedMetrics,
            date_range_months: gaConfig.dateRangeMonths,
          },
          encrypted_credentials: JSON.stringify({
            access_token: gaConfig.accessToken,
            refresh_token: gaConfig.refreshToken,
            client_id: gaConfig.clientId,
            client_secret: gaConfig.clientSecret,
          }),
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          const { error } = await supabase
            .from('company_integrations')
            .update(integrationData)
            .eq('id', existing.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('company_integrations')
            .insert(integrationData);

          if (error) throw error;
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'sync': {
        console.log('Starting sync for company:', companyId);
        
        // Get integration config
        const { data: integration, error: intError } = await supabase
          .from('company_integrations')
          .select('*')
          .eq('company_id', companyId)
          .eq('integration_type', 'google_analytics')
          .single();

        if (intError || !integration) {
          console.error('Integration not found:', intError);
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Integration not found. Please configure Google Analytics first.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get OAuth tokens from company_oauth_tokens table (where OAuth flow stores them)
        const { data: oauthToken, error: oauthError } = await supabase
          .from('company_oauth_tokens')
          .select('id, access_token, refresh_token, token_expires_at')
          .eq('company_id', companyId)
          .eq('provider', 'google_analytics')
          .maybeSingle();

        console.log('OAuth token lookup:', { found: !!oauthToken, error: oauthError?.message });

        if (oauthError || !oauthToken) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Google Analytics OAuth not connected. Please reconnect in Settings → Integrations.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Helper function to refresh token if expired
        const getValidAccessToken = async (): Promise<string> => {
          const now = new Date();
          const expiresAt = oauthToken.token_expires_at ? new Date(oauthToken.token_expires_at) : null;
          
          // Check if token is expired or will expire in the next 5 minutes
          const needsRefresh = !expiresAt || expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;
          
          if (!needsRefresh) {
            console.log('Access token still valid, expires at:', expiresAt);
            return oauthToken.access_token;
          }

          console.log('Access token expired or expiring soon, refreshing...');

          if (!oauthToken.refresh_token) {
            throw new Error('No refresh token available. Please reconnect Google Analytics.');
          }

          // Get client credentials from environment
          const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
          const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

          if (!clientId || !clientSecret) {
            throw new Error('Google OAuth credentials not configured in environment');
          }

          // Refresh the token
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
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
            throw new Error('Failed to refresh access token. Please reconnect Google Analytics.');
          }

          const tokenData = await tokenResponse.json();
          console.log('Token refreshed successfully');

          // Calculate new expiry time
          const newExpiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

          // Update the token in the database
          const { error: updateError } = await supabase
            .from('company_oauth_tokens')
            .update({
              access_token: tokenData.access_token,
              token_expires_at: newExpiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', oauthToken.id);

          if (updateError) {
            console.error('Failed to update token in database:', updateError);
          }

          return tokenData.access_token;
        };

        // Get valid access token
        let accessToken: string;
        try {
          accessToken = await getValidAccessToken();
        } catch (tokenError) {
          console.error('Token error:', tokenError);
          return new Response(JSON.stringify({ 
            success: false, 
            error: tokenError.message 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const integrationConfig = integration.config as { 
          property_id?: string;
          propertyId?: string;
          selected_metrics?: string[]; 
          date_range_months?: number 
        };

        const propertyId = integrationConfig.property_id || integrationConfig.propertyId;
        if (!propertyId) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No Google Analytics property configured.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create sync log entry
        const { data: syncLog, error: syncLogError } = await supabase
          .from('integration_sync_log')
          .insert({
            company_id: companyId,
            integration_id: integration.id,
            sync_type: 'manual',
            status: 'running',
          })
          .select()
          .single();

        if (syncLogError) {
          console.error('Failed to create sync log:', syncLogError);
        }

        try {
          // Calculate date range
          const endDateObj = new Date();
          const startDateObj = new Date();
          startDateObj.setMonth(startDateObj.getMonth() - (integrationConfig.date_range_months || 3));

          const dateRange = {
            startDate: startDateObj.toISOString().split('T')[0],
            endDate: endDateObj.toISOString().split('T')[0],
          };

          let recordsProcessed = 0;

          // Helper function to make GA4 API requests
          const fetchGAReport = async (requestBody: Record<string, unknown>) => {
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
              throw new Error('Failed to fetch analytics data: ' + errorText);
            }
            return response.json();
          };

          // 1. Fetch total users by date
          const totalUsersData = await fetchGAReport({
            dateRanges: [dateRange],
            metrics: [{ name: 'totalUsers' }],
            dimensions: [{ name: 'date' }],
            orderBys: [{ dimension: { dimensionName: 'date' } }],
          });

          // 2. Fetch page-specific users (pricing, book-a-call, book-a-demo)
          const pageMetrics = [
            { id: 'pricingPageUsers', path: '/pricing' },
            { id: 'bookCallPageUsers', path: '/book-a-call' },
            { id: 'bookDemoPageUsers', path: '/book-a-demo' },
          ];

          const pageUsersByDate: Record<string, Record<string, number>> = {};

          for (const pageMetric of pageMetrics) {
            const pageData = await fetchGAReport({
              dateRanges: [dateRange],
              metrics: [{ name: 'totalUsers' }],
              dimensions: [{ name: 'date' }],
              dimensionFilter: {
                filter: {
                  fieldName: 'pagePath',
                  stringFilter: {
                    matchType: 'CONTAINS',
                    value: pageMetric.path,
                  },
                },
              },
              orderBys: [{ dimension: { dimensionName: 'date' } }],
            });

            for (const row of pageData.rows || []) {
              const dateValue = row.dimensionValues[0].value;
              if (!pageUsersByDate[dateValue]) {
                pageUsersByDate[dateValue] = {};
              }
              pageUsersByDate[dateValue][pageMetric.id] = parseInt(row.metricValues[0]?.value || '0');
            }
          }

          // 3. Fetch purchases (ecommerce transactions)
          const purchasesData = await fetchGAReport({
            dateRanges: [dateRange],
            metrics: [{ name: 'transactions' }],
            dimensions: [{ name: 'date' }],
            orderBys: [{ dimension: { dimensionName: 'date' } }],
          });

          const purchasesByDate: Record<string, number> = {};
          for (const row of purchasesData.rows || []) {
            const dateValue = row.dimensionValues[0].value;
            purchasesByDate[dateValue] = parseInt(row.metricValues[0]?.value || '0');
          }

          // 4. Fetch signups (using conversions event or custom event)
          // Try to get sign_up events first, fallback to conversions
          let signupsByDate: Record<string, number> = {};
          try {
            const signupsData = await fetchGAReport({
              dateRanges: [dateRange],
              metrics: [{ name: 'eventCount' }],
              dimensions: [{ name: 'date' }],
              dimensionFilter: {
                filter: {
                  fieldName: 'eventName',
                  stringFilter: {
                    matchType: 'EXACT',
                    value: 'sign_up',
                  },
                },
              },
              orderBys: [{ dimension: { dimensionName: 'date' } }],
            });

            for (const row of signupsData.rows || []) {
              const dateValue = row.dimensionValues[0].value;
              signupsByDate[dateValue] = parseInt(row.metricValues[0]?.value || '0');
            }
          } catch (e) {
            console.log('sign_up event not found, using conversions');
            const conversionsData = await fetchGAReport({
              dateRanges: [dateRange],
              metrics: [{ name: 'conversions' }],
              dimensions: [{ name: 'date' }],
              orderBys: [{ dimension: { dimensionName: 'date' } }],
            });

            for (const row of conversionsData.rows || []) {
              const dateValue = row.dimensionValues[0].value;
              signupsByDate[dateValue] = parseInt(row.metricValues[0]?.value || '0');
            }
          }

          // Process and store all metrics by date
          for (const row of totalUsersData.rows || []) {
            const dateValue = row.dimensionValues[0].value;
            const formattedDate = `${dateValue.slice(0, 4)}-${dateValue.slice(4, 6)}-${dateValue.slice(6, 8)}`;
            const totalUsers = parseInt(row.metricValues[0]?.value || '0');

            // Store metrics in a structured format
            const metricsData = {
              company_id: companyId,
              campaign_id: `ga_${propertyId}`,
              campaign_name: 'Google Analytics',
              channel_source: 'google_analytics',
              date_reported: formattedDate,
              impressions: totalUsers, // Using impressions to store totalUsers
              clicks: pageUsersByDate[dateValue]?.pricingPageUsers || 0, // Pricing page users
              conversions: purchasesByDate[dateValue] || 0, // Purchases
              spend: signupsByDate[dateValue] || null, // Using spend field for signups (temporary)
              ctr: pageUsersByDate[dateValue]?.bookCallPageUsers || null, // Book a call users
              cpc: pageUsersByDate[dateValue]?.bookDemoPageUsers || null, // Book a demo users
              cpm: null,
              last_synced_at: new Date().toISOString(),
            };

            const { error: upsertError } = await supabase
              .from('marketing_campaign_metrics')
              .upsert(metricsData, {
                onConflict: 'company_id,campaign_id,date_reported',
              });

            if (upsertError) {
              console.error('Failed to upsert metrics:', upsertError);
            } else {
              recordsProcessed++;
            }
          }

          // Update sync log
          if (syncLog) {
            await supabase
              .from('integration_sync_log')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                records_processed: recordsProcessed,
                records_created: recordsProcessed,
                details: {
                  metrics_synced: [
                    'totalUsers',
                    'pricingPageUsers',
                    'bookCallPageUsers',
                    'bookDemoPageUsers',
                    'purchases',
                    'signups',
                  ],
                },
              })
              .eq('id', syncLog.id);
          }

          // Update last sync time
          await supabase
            .from('company_integrations')
            .update({ last_sync_at: new Date().toISOString() })
            .eq('id', integration.id);

          return new Response(JSON.stringify({ 
            success: true, 
            recordsProcessed,
            message: 'Synced: Total Users, Pricing/Book-a-call/Book-a-demo page visits, Purchases, Sign Ups'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (syncError) {
          console.error('Sync error:', syncError);
          
          if (syncLog) {
            await supabase
              .from('integration_sync_log')
              .update({
                status: 'failed',
                completed_at: new Date().toISOString(),
                error_message: syncError.message,
              })
              .eq('id', syncLog.id);
          }

          return new Response(JSON.stringify({ 
            success: false, 
            error: syncError.message 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      case 'sync-reporting-metrics': {
        console.log('Starting sync-reporting-metrics for company:', companyId);
        
        // Get GA OAuth tokens for this company
        const { data: oauthToken, error: oauthError } = await supabase
          .from('company_oauth_tokens')
          .select('id, access_token, refresh_token, token_expires_at')
          .eq('company_id', companyId)
          .eq('provider', 'google_analytics')
          .maybeSingle();

        console.log('OAuth token lookup:', { found: !!oauthToken, error: oauthError?.message });

        if (oauthError || !oauthToken) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Google Analytics not connected. Please connect in Settings → Integrations.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Helper function to refresh token if expired
        const getValidAccessToken = async (): Promise<string> => {
          const now = new Date();
          const expiresAt = oauthToken.token_expires_at ? new Date(oauthToken.token_expires_at) : null;
          
          // Check if token is expired or will expire in the next 5 minutes
          const needsRefresh = !expiresAt || expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;
          
          if (!needsRefresh) {
            console.log('Access token still valid, expires at:', expiresAt);
            return oauthToken.access_token;
          }

          console.log('Access token expired or expiring soon, refreshing...');

          if (!oauthToken.refresh_token) {
            throw new Error('No refresh token available. Please reconnect Google Analytics.');
          }

          // Get client credentials from environment
          const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
          const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

          if (!clientId || !clientSecret) {
            throw new Error('Google OAuth credentials not configured');
          }

          // Refresh the token
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
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
            throw new Error('Failed to refresh access token. Please reconnect Google Analytics.');
          }

          const tokenData = await tokenResponse.json();
          console.log('Token refreshed successfully');

          // Calculate new expiry time
          const newExpiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

          // Update the token in the database
          const { error: updateError } = await supabase
            .from('company_oauth_tokens')
            .update({
              access_token: tokenData.access_token,
              token_expires_at: newExpiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', oauthToken.id);

          if (updateError) {
            console.error('Failed to update token in database:', updateError);
          }

          return tokenData.access_token;
        };

        // Get integration config for property ID
        const { data: integration, error: intError } = await supabase
          .from('company_integrations')
          .select('config')
          .eq('company_id', companyId)
          .eq('integration_type', 'google_analytics')
          .eq('is_active', true)
          .maybeSingle();

        console.log('Integration config lookup:', { found: !!integration, config: integration?.config, error: intError?.message });

        if (intError || !integration?.config) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Google Analytics not configured. Please configure a property in Settings → Integrations.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const gaConfig = integration.config as { propertyId?: string; property_id?: string };
        const propertyId = gaConfig.propertyId || gaConfig.property_id;

        console.log('Property ID:', propertyId);

        if (!propertyId) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No Google Analytics property configured.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get valid access token (refreshing if needed)
        let accessToken: string;
        try {
          accessToken = await getValidAccessToken();
        } catch (tokenError) {
          console.error('Token error:', tokenError);
          return new Response(JSON.stringify({ 
            success: false, 
            error: tokenError.message 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get all metrics with google_analytics integration type
        // Note: startDate, endDate, metricIds already parsed from initial req.json()

        let metricsQuery = supabase
          .from('reporting_metrics')
          .select('id, name, integration_field')
          .eq('company_id', companyId)
          .eq('integration_type', 'google_analytics')
          .not('integration_field', 'is', null);

        if (metricIds?.length) {
          metricsQuery = metricsQuery.in('id', metricIds);
        }

        const { data: metrics, error: metricsError } = await metricsQuery;

        if (metricsError) {
          console.error('Error fetching metrics:', metricsError);
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Failed to fetch metrics configuration' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!metrics || metrics.length === 0) {
          return new Response(JSON.stringify({ 
            success: true, 
            recordsProcessed: 0,
            metricsUpdated: [],
            message: 'No metrics configured for Google Analytics sync' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Calculate date range (default to last 24 months if not specified)
        const now = new Date();
        const defaultStartDate = new Date(now.getFullYear() - 2, 0, 1);
        const dateRange = {
          startDate: startDate || defaultStartDate.toISOString().split('T')[0],
          endDate: endDate || now.toISOString().split('T')[0],
        };

        // Group metrics by their GA field to minimize API calls
        const fieldToMetrics: Record<string, Array<{ id: string; name: string }>> = {};
        for (const metric of metrics) {
          const field = metric.integration_field!;
          if (!fieldToMetrics[field]) {
            fieldToMetrics[field] = [];
          }
          fieldToMetrics[field].push({ id: metric.id, name: metric.name });
        }

        // Map our field names to GA4 API metric names
        const fieldToGAMetric: Record<string, string> = {
          totalUsers: 'totalUsers',
          sessions: 'sessions',
          pageviews: 'screenPageViews',
          newUsers: 'newUsers',
          bounceRate: 'bounceRate',
          avgSessionDuration: 'averageSessionDuration',
          transactions: 'transactions',
          purchaseRevenue: 'purchaseRevenue',
          conversions: 'conversions',
          eventCount: 'eventCount',
        };

        let totalRecordsProcessed = 0;
        const metricsUpdated: string[] = [];
        const valuesToUpsert: Array<{
          metric_id: string;
          period_date: string;
          value: number;
          is_manual_override: boolean;
        }> = [];

        // Fetch data for each unique GA field
        for (const [field, fieldMetrics] of Object.entries(fieldToMetrics)) {
          const gaMetricName = fieldToGAMetric[field];
          if (!gaMetricName) {
            console.warn(`Unknown GA field: ${field}`);
            continue;
          }

          try {
            // Fetch monthly data from GA4
            const response = await fetch(
              `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  dateRanges: [dateRange],
                  metrics: [{ name: gaMetricName }],
                  dimensions: [{ name: 'yearMonth' }],
                  orderBys: [{ dimension: { dimensionName: 'yearMonth' } }],
                }),
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`GA API error for ${field}:`, errorText);
              continue;
            }

            const data = await response.json();

            // Process each row and create values for all metrics mapped to this field
            for (const row of data.rows || []) {
              const yearMonth = row.dimensionValues[0].value; // Format: YYYYMM
              const year = yearMonth.slice(0, 4);
              const month = yearMonth.slice(4, 6);
              const periodDate = `${year}-${month}-01`;
              
              let value = parseFloat(row.metricValues[0]?.value || '0');
              
              // Convert bounce rate and percentages to proper format
              if (field === 'bounceRate') {
                value = value * 100; // GA returns as decimal, convert to percentage
              }

              // Create a value record for each metric mapped to this field
              for (const metric of fieldMetrics) {
                valuesToUpsert.push({
                  metric_id: metric.id,
                  period_date: periodDate,
                  value,
                  is_manual_override: false,
                });
                
                if (!metricsUpdated.includes(metric.name)) {
                  metricsUpdated.push(metric.name);
                }
              }
              
              totalRecordsProcessed++;
            }
          } catch (fetchError) {
            console.error(`Error fetching ${field} data:`, fetchError);
          }
        }

        // Batch upsert all values
        if (valuesToUpsert.length > 0) {
          const { error: upsertError } = await supabase
            .from('reporting_metric_values')
            .upsert(valuesToUpsert, { onConflict: 'metric_id,period_date' });

          if (upsertError) {
            console.error('Error upserting values:', upsertError);
            return new Response(JSON.stringify({ 
              success: false, 
              error: 'Failed to save synced data' 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        console.log(`Synced ${valuesToUpsert.length} values for ${metricsUpdated.length} metrics`);

        return new Response(JSON.stringify({ 
          success: true, 
          recordsProcessed: valuesToUpsert.length,
          metricsUpdated,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'disconnect': {
        const { error } = await supabase
          .from('company_integrations')
          .delete()
          .eq('company_id', companyId)
          .eq('integration_type', 'google_analytics');

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
