import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchConsoleRequest {
  action: 'test-connection' | 'get-sites' | 'list_sites' | 'save-config' | 'sync' | 'disconnect'
  integrationId?: string
  companyId?: string
  credentials?: {
    accessToken: string
    refreshToken: string
    clientId: string
    clientSecret: string
  }
  config?: {
    siteUrl: string
    dateRangePreset: string
  }
}

// Helper to get valid access token from OAuth tokens table
async function getValidAccessToken(supabase: any, companyId: string): Promise<string> {
  const { data: oauthToken, error } = await supabase
    .from('company_oauth_tokens')
    .select('id, access_token, refresh_token, token_expires_at')
    .eq('company_id', companyId)
    .eq('provider', 'google_search_console')
    .maybeSingle();

  if (error || !oauthToken) {
    throw new Error('Google Search Console not connected. Please reconnect in Settings.');
  }

  const now = new Date();
  const expiresAt = oauthToken.token_expires_at ? new Date(oauthToken.token_expires_at) : null;
  const needsRefresh = !expiresAt || expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

  if (!needsRefresh) {
    return oauthToken.access_token;
  }

  console.log('Refreshing access token...');

  if (!oauthToken.refresh_token) {
    throw new Error('No refresh token. Please reconnect Google Search Console.');
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
    throw new Error('Token expired. Please reconnect Google Search Console.');
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const body: SearchConsoleRequest = await req.json()
    const { action, integrationId, companyId, credentials, config } = body

    console.log(`Google Search Console action: ${action}`, { integrationId, companyId })

    switch (action) {
      case 'test-connection': {
        if (!credentials?.accessToken) {
          throw new Error('Access token is required')
        }

        // Test connection by fetching sites list
        const sitesResponse = await fetch(
          'https://www.googleapis.com/webmasters/v3/sites',
          {
            headers: {
              'Authorization': `Bearer ${credentials.accessToken}`,
            },
          }
        )

        if (!sitesResponse.ok) {
          const errorData = await sitesResponse.json()
          console.error('Search Console API error:', errorData)
          throw new Error(errorData.error?.message || 'Failed to connect to Google Search Console')
        }

        const sitesData = await sitesResponse.json()
        console.log('Sites fetched:', sitesData)

        // Create or update integration record
        const { data: existingIntegration } = await supabase
          .from('company_integrations')
          .select('id')
          .eq('company_id', companyId)
          .eq('integration_type', 'google_search_console')
          .single()

        const integrationData = {
          company_id: companyId,
          integration_type: 'google_search_console',
          is_active: false,
          encrypted_credentials: JSON.stringify(credentials),
          config: {},
          updated_at: new Date().toISOString(),
        }

        let newIntegrationId: string

        if (existingIntegration) {
          await supabase
            .from('company_integrations')
            .update(integrationData)
            .eq('id', existingIntegration.id)
          newIntegrationId = existingIntegration.id
        } else {
          const { data: newIntegration, error: insertError } = await supabase
            .from('company_integrations')
            .insert(integrationData)
            .select('id')
            .single()

          if (insertError) throw insertError
          newIntegrationId = newIntegration.id
        }

        const sites = sitesData.siteEntry?.map((site: any) => ({
          siteUrl: site.siteUrl,
          permissionLevel: site.permissionLevel,
        })) || []

        return new Response(
          JSON.stringify({ 
            success: true, 
            integrationId: newIntegrationId,
            sites,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get-sites':
      case 'list_sites': {
        // Support both action names for backwards compatibility
        if (!companyId) {
          throw new Error('companyId is required')
        }

        // Get access token from OAuth tokens table
        const accessToken = await getValidAccessToken(supabase, companyId)
        
        const sitesResponse = await fetch(
          'https://www.googleapis.com/webmasters/v3/sites',
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        )

        if (!sitesResponse.ok) {
          const errorData = await sitesResponse.json()
          console.error('Failed to fetch sites:', errorData)
          throw new Error(errorData.error?.message || 'Failed to fetch sites')
        }

        const sitesData = await sitesResponse.json()
        const sites = sitesData.siteEntry?.map((site: any) => ({
          siteUrl: site.siteUrl,
          permissionLevel: site.permissionLevel,
        })) || []

        return new Response(
          JSON.stringify({ success: true, sites }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'save-config': {
        if (!integrationId || !config) {
          throw new Error('Integration ID and config are required')
        }

        const { error: updateError } = await supabase
          .from('company_integrations')
          .update({
            config,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', integrationId)

        if (updateError) throw updateError

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'sync': {
        if (!integrationId) {
          throw new Error('Integration ID is required')
        }

        const { data: integration, error: fetchError } = await supabase
          .from('company_integrations')
          .select('*')
          .eq('id', integrationId)
          .single()

        if (fetchError || !integration) {
          throw new Error('Integration not found')
        }

        const creds = JSON.parse(integration.encrypted_credentials || '{}')
        const integrationConfig = integration.config as any

        // Calculate date range
        const endDate = new Date()
        let startDate = new Date()
        
        switch (integrationConfig.dateRangePreset) {
          case 'last_7_days':
            startDate.setDate(endDate.getDate() - 7)
            break
          case 'last_30_days':
            startDate.setDate(endDate.getDate() - 30)
            break
          case 'last_90_days':
            startDate.setDate(endDate.getDate() - 90)
            break
          default:
            startDate.setDate(endDate.getDate() - 30)
        }

        // Create sync log entry
        const { data: syncLog, error: syncLogError } = await supabase
          .from('integration_sync_log')
          .insert({
            integration_id: integrationId,
            company_id: integration.company_id,
            sync_type: 'manual',
            status: 'in_progress',
            started_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (syncLogError) throw syncLogError

        try {
          // Fetch search analytics data
          const analyticsResponse = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(integrationConfig.siteUrl)}/searchAnalytics/query`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${creds.accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                dimensions: ['date', 'query'],
                rowLimit: 1000,
              }),
            }
          )

          if (!analyticsResponse.ok) {
            const errorData = await analyticsResponse.json()
            throw new Error(errorData.error?.message || 'Failed to fetch search analytics')
          }

          const analyticsData = await analyticsResponse.json()
          console.log('Search analytics data fetched:', analyticsData.rows?.length || 0, 'rows')

          // Aggregate data by date
          const dateMetrics: Record<string, { clicks: number; impressions: number; ctr: number; position: number; count: number }> = {}

          for (const row of analyticsData.rows || []) {
            const date = row.keys[0]
            if (!dateMetrics[date]) {
              dateMetrics[date] = { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 }
            }
            dateMetrics[date].clicks += row.clicks || 0
            dateMetrics[date].impressions += row.impressions || 0
            dateMetrics[date].ctr += row.ctr || 0
            dateMetrics[date].position += row.position || 0
            dateMetrics[date].count += 1
          }

          // Prepare records for upsert
          const metricsToUpsert = Object.entries(dateMetrics).map(([date, metrics]) => ({
            company_id: integration.company_id,
            channel_source: 'google_search_console',
            campaign_id: integrationConfig.siteUrl,
            campaign_name: integrationConfig.siteUrl,
            date_reported: date,
            impressions: Math.round(metrics.impressions),
            clicks: Math.round(metrics.clicks),
            ctr: metrics.count > 0 ? (metrics.ctr / metrics.count) * 100 : 0,
            cpc: 0, // Not applicable for organic search
            cpm: 0, // Not applicable for organic search
            spend: 0, // Not applicable for organic search
            conversions: 0,
            last_synced_at: new Date().toISOString(),
          }))

          // Upsert metrics
          if (metricsToUpsert.length > 0) {
            const { error: upsertError } = await supabase
              .from('marketing_campaign_metrics')
              .upsert(metricsToUpsert, {
                onConflict: 'company_id,channel_source,campaign_id,date_reported',
              })

            if (upsertError) {
              console.error('Error upserting metrics:', upsertError)
              throw upsertError
            }
          }

          // Update sync log with success
          await supabase
            .from('integration_sync_log')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              records_processed: analyticsData.rows?.length || 0,
              records_created: metricsToUpsert.length,
            })
            .eq('id', syncLog.id)

          // Update last sync timestamp
          await supabase
            .from('company_integrations')
            .update({ last_sync_at: new Date().toISOString() })
            .eq('id', integrationId)

          return new Response(
            JSON.stringify({ 
              success: true, 
              recordsProcessed: analyticsData.rows?.length || 0,
              recordsSynced: metricsToUpsert.length,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (syncError) {
          // Update sync log with error
          await supabase
            .from('integration_sync_log')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: syncError instanceof Error ? syncError.message : 'Unknown error',
            })
            .eq('id', syncLog.id)

          throw syncError
        }
      }

      case 'disconnect': {
        if (!integrationId) {
          throw new Error('Integration ID is required')
        }

        const { error: deleteError } = await supabase
          .from('company_integrations')
          .delete()
          .eq('id', integrationId)

        if (deleteError) throw deleteError

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('Google Search Console function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
