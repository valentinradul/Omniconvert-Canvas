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

    const { action, companyId, config } = await req.json();

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
        // Get integration config
        const { data: integration, error: intError } = await supabase
          .from('company_integrations')
          .select('*')
          .eq('company_id', companyId)
          .eq('integration_type', 'google_analytics')
          .single();

        if (intError || !integration) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Integration not found' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const credentials = JSON.parse(integration.encrypted_credentials);
        const integrationConfig = integration.config as { 
          property_id: string; 
          selected_metrics: string[]; 
          date_range_months: number 
        };

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
          const endDate = new Date();
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - (integrationConfig.date_range_months || 3));

          const dateRange = {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          };

          const propertyId = integrationConfig.property_id;
          const accessToken = credentials.access_token;
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
              throw new Error('Failed to fetch analytics data');
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
