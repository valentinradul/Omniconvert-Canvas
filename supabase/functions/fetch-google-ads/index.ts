import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com/v18';

interface GoogleAdsConfig {
  customerId: string;
  selectedCampaigns: string[];
  dateRangePreset: 'last_7d' | 'last_30d' | 'last_90d';
}

// Helper to get valid access token from OAuth tokens table
async function getValidAccessToken(supabase: any, companyId: string): Promise<string> {
  const { data: oauthToken, error } = await supabase
    .from('company_oauth_tokens')
    .select('id, access_token, refresh_token, token_expires_at')
    .eq('company_id', companyId)
    .eq('provider', 'google_ads')
    .maybeSingle();

  if (error || !oauthToken) {
    throw new Error('Google Ads not connected. Please reconnect in Settings.');
  }

  const now = new Date();
  const expiresAt = oauthToken.token_expires_at ? new Date(oauthToken.token_expires_at) : null;
  const needsRefresh = !expiresAt || expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

  if (!needsRefresh) {
    return oauthToken.access_token;
  }

  console.log('Refreshing access token...');

  if (!oauthToken.refresh_token) {
    throw new Error('No refresh token. Please reconnect Google Ads.');
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
    throw new Error('Token expired. Please reconnect Google Ads.');
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

  return tokenData.access_token;
}

// Get developer token from environment
function getDeveloperToken(): string {
  const token = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');
  if (!token) {
    throw new Error('Google Ads Developer Token not configured. Please add GOOGLE_ADS_DEVELOPER_TOKEN secret.');
  }
  return token;
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
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
    const { action, companyId, accessToken, customerId, config } = body;

    console.log('Google Ads action:', action, { companyId, customerId });

    // Verify user has access to company
    const { data: membership } = await supabase
      .from('company_members')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (action) {
      case 'get-campaigns': {
        if (!customerId) {
          throw new Error('Customer ID is required');
        }

        // Use provided accessToken or get from database
        const token = accessToken || await getValidAccessToken(supabase, companyId);
        const developerToken = getDeveloperToken();
        const cleanCustomerId = customerId.replace(/-/g, '');

        const query = `
          SELECT 
            campaign.id,
            campaign.name,
            campaign.status,
            campaign.advertising_channel_type
          FROM campaign
          WHERE campaign.status != 'REMOVED'
          ORDER BY campaign.name
        `;

        console.log('Fetching campaigns for customer:', cleanCustomerId);

        const response = await fetch(
          `${GOOGLE_ADS_API_BASE}/customers/${cleanCustomerId}/googleAds:searchStream`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'developer-token': developerToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
          }
        );

        const responseText = await response.text();
        
        if (!response.ok) {
          console.error('Google Ads API error:', responseText);
          // Try to parse as JSON for error details
          try {
            const errorJson = JSON.parse(responseText);
            throw new Error(errorJson.error?.message || 'Failed to fetch campaigns');
          } catch {
            throw new Error('Failed to fetch campaigns. Check your Customer ID and permissions.');
          }
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error('Failed to parse response:', responseText.substring(0, 200));
          throw new Error('Invalid response from Google Ads API');
        }

        const campaigns = (data[0]?.results || []).map((result: any) => ({
          id: result.campaign.id,
          name: result.campaign.name,
          status: result.campaign.status,
          channelType: result.campaign.advertisingChannelType,
        }));

        return new Response(JSON.stringify({ success: true, campaigns }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'save-config': {
        if (!companyId || !customerId || !config) {
          throw new Error('companyId, customerId, and config are required');
        }

        // Check if integration already exists
        const { data: existing } = await supabase
          .from('company_integrations')
          .select('id')
          .eq('company_id', companyId)
          .eq('integration_type', 'google_ads')
          .maybeSingle();

        const integrationData = {
          company_id: companyId,
          integration_type: 'google_ads',
          config: { ...config, customerId },
          is_active: true,
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          await supabase
            .from('company_integrations')
            .update(integrationData)
            .eq('id', existing.id);
        } else {
          await supabase.from('company_integrations').insert(integrationData);
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
          .eq('integration_type', 'google_ads')
          .eq('is_active', true)
          .single();

        if (intError || !integration) {
          throw new Error('Google Ads integration not configured');
        }

        const intConfig = integration.config as GoogleAdsConfig;
        const cleanCustomerId = intConfig.customerId.replace(/-/g, '');
        
        // Get access token from OAuth tokens
        const token = await getValidAccessToken(supabase, companyId);
        const developerToken = getDeveloperToken();

        // Calculate date range
        const { since, until } = getDateRange(intConfig.dateRangePreset);

        // Create sync log entry
        const { data: syncLog } = await supabase
          .from('integration_sync_log')
          .insert({
            company_id: companyId,
            integration_id: integration.id,
            sync_type: 'manual',
            status: 'running',
          })
          .select()
          .single();

        try {
          // Build campaign filter
          const campaignFilter = intConfig.selectedCampaigns?.length > 0
            ? `AND campaign.id IN (${intConfig.selectedCampaigns.join(',')})`
            : '';

          const query = `
            SELECT 
              campaign.id,
              campaign.name,
              segments.date,
              metrics.cost_micros,
              metrics.impressions,
              metrics.clicks,
              metrics.conversions,
              metrics.ctr,
              metrics.average_cpc
            FROM campaign
            WHERE segments.date BETWEEN '${since}' AND '${until}'
            ${campaignFilter}
            ORDER BY segments.date DESC
          `;

          const response = await fetch(
            `${GOOGLE_ADS_API_BASE}/customers/${cleanCustomerId}/googleAds:searchStream`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'developer-token': developerToken,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ query }),
            }
          );

          const responseText = await response.text();
          
          if (!response.ok) {
            console.error('Google Ads sync error:', responseText);
            throw new Error('Failed to fetch campaign data');
          }

          let data;
          try {
            data = JSON.parse(responseText);
          } catch {
            throw new Error('Invalid response from Google Ads API');
          }

          const results = data[0]?.results || [];
          let recordsCreated = 0;
          let recordsUpdated = 0;

          // Process each result
          for (const result of results) {
            const spend = (parseInt(result.metrics.costMicros) || 0) / 1_000_000;
            const impressions = parseInt(result.metrics.impressions) || 0;
            const clicks = parseInt(result.metrics.clicks) || 0;
            const conversions = parseInt(result.metrics.conversions) || 0;
            const ctr = parseFloat(result.metrics.ctr) * 100 || 0;
            const cpc = (parseInt(result.metrics.averageCpc) || 0) / 1_000_000;
            const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;

            const metricData = {
              company_id: companyId,
              channel_source: 'Google',
              campaign_id: result.campaign.id.toString(),
              campaign_name: result.campaign.name,
              date_reported: result.segments.date,
              spend,
              impressions,
              clicks,
              conversions,
              ctr: parseFloat(ctr.toFixed(2)),
              cpc: parseFloat(cpc.toFixed(2)),
              cpm: parseFloat(cpm.toFixed(2)),
              last_synced_at: new Date().toISOString(),
            };

            // Upsert the metric
            const { data: existingMetric } = await supabase
              .from('marketing_campaign_metrics')
              .select('id')
              .eq('company_id', companyId)
              .eq('campaign_id', result.campaign.id.toString())
              .eq('date_reported', result.segments.date)
              .eq('channel_source', 'Google')
              .maybeSingle();

            if (existingMetric) {
              await supabase
                .from('marketing_campaign_metrics')
                .update(metricData)
                .eq('id', existingMetric.id);
              recordsUpdated++;
            } else {
              await supabase.from('marketing_campaign_metrics').insert(metricData);
              recordsCreated++;
            }
          }

          // Update sync log
          await supabase
            .from('integration_sync_log')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              records_processed: results.length,
              records_created: recordsCreated,
              records_updated: recordsUpdated,
            })
            .eq('id', syncLog.id);

          // Update last sync time
          await supabase
            .from('company_integrations')
            .update({ last_sync_at: new Date().toISOString() })
            .eq('id', integration.id);

          return new Response(JSON.stringify({
            success: true,
            campaignsProcessed: results.length,
            recordsCreated,
            recordsUpdated,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        } catch (syncError: any) {
          // Update sync log with error
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
          throw syncError;
        }
      }

      case 'disconnect': {
        await supabase
          .from('company_integrations')
          .update({ is_active: false })
          .eq('company_id', companyId)
          .eq('integration_type', 'google_ads');

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
  } catch (error: any) {
    console.error('Error in fetch-google-ads:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getDateRange(preset: string) {
  const now = new Date();
  let since: string;
  const until: string = now.toISOString().split('T')[0];

  switch (preset) {
    case 'last_7d':
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case 'last_30d':
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case 'last_90d':
      since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    default:
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  return { since, until };
}
