import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Google OAuth scopes for all Google integrations
const GOOGLE_SCOPES = {
  ads: [
    'https://www.googleapis.com/auth/adwords',
  ],
  analytics: [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/analytics.manage.users.readonly',
  ],
  search_console: [
    'https://www.googleapis.com/auth/webmasters.readonly',
  ],
};

interface OAuthRequest {
  action: 'start' | 'callback' | 'refresh' | 'disconnect';
  companyId?: string;
  service?: 'ads' | 'analytics' | 'search_console';
  code?: string;
  state?: string;
  redirectUri?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get OAuth credentials from environment
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ 
          error: 'Google OAuth not configured',
          message: 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET secrets'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: OAuthRequest = await req.json();
    const { action, companyId, service, code, state, redirectUri } = body;

    console.log(`Google OAuth action: ${action}`, { companyId, service });

    switch (action) {
      case 'start': {
        if (!companyId || !service || !redirectUri) {
          throw new Error('companyId, service, and redirectUri are required');
        }

        // Build OAuth URL
        const scopes = GOOGLE_SCOPES[service].join(' ');
        const stateData = JSON.stringify({ companyId, service });
        const encodedState = btoa(stateData);

        const authUrl = new URL(GOOGLE_AUTH_URL);
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', scopes);
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');
        authUrl.searchParams.set('state', encodedState);

        return new Response(
          JSON.stringify({ authUrl: authUrl.toString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'callback': {
        if (!code || !state || !redirectUri) {
          throw new Error('code, state, and redirectUri are required');
        }

        // Decode state to get companyId and service
        let stateData: { companyId: string; service: 'ads' | 'analytics' | 'search_console' };
        try {
          stateData = JSON.parse(atob(state));
        } catch {
          throw new Error('Invalid state parameter');
        }

        // Exchange code for tokens
        const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.json();
          console.error('Token exchange error:', error);
          throw new Error(error.error_description || 'Failed to exchange code for tokens');
        }

        const tokens = await tokenResponse.json();
        const expiresAt = tokens.expires_in 
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null;

        // Determine provider name based on service
        const providerMap = {
          ads: 'google_ads',
          analytics: 'google_analytics',
          search_console: 'google_search_console',
        };
        const provider = providerMap[stateData.service];

        // Upsert OAuth token
        const { error: upsertError } = await supabase
          .from('company_oauth_tokens')
          .upsert({
            company_id: stateData.companyId,
            provider,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: expiresAt,
            scopes: GOOGLE_SCOPES[stateData.service],
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'company_id,provider',
          });

        if (upsertError) {
          console.error('Failed to save tokens:', upsertError);
          throw new Error('Failed to save OAuth tokens');
        }

        // Also ensure company_integrations record exists for this integration
        const integrationTypeMap = {
          ads: 'google_ads',
          analytics: 'google_analytics',
          search_console: 'google_search_console',
        };
        const integrationType = integrationTypeMap[stateData.service];

        // Check if integration already exists
        const { data: existingIntegration } = await supabase
          .from('company_integrations')
          .select('id')
          .eq('company_id', stateData.companyId)
          .eq('integration_type', integrationType)
          .maybeSingle();

        if (!existingIntegration) {
          // Create a basic integration record - user will configure property later
          const { error: integrationError } = await supabase
            .from('company_integrations')
            .insert({
              company_id: stateData.companyId,
              integration_type: integrationType,
              is_active: true,
              config: {},
              updated_at: new Date().toISOString(),
            });

          if (integrationError) {
            console.error('Failed to create integration record:', integrationError);
            // Don't fail - OAuth tokens are saved, integration can be created later
          }
        } else {
          // Mark existing integration as active
          await supabase
            .from('company_integrations')
            .update({ is_active: true, updated_at: new Date().toISOString() })
            .eq('id', existingIntegration.id);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            provider,
            message: 'Successfully connected to Google' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'refresh': {
        if (!companyId || !service) {
          throw new Error('companyId and service are required');
        }

        const providerMap = {
          ads: 'google_ads',
          analytics: 'google_analytics',
          search_console: 'google_search_console',
        };
        const provider = providerMap[service];

        // Get existing token
        const { data: tokenData, error: tokenError } = await supabase
          .from('company_oauth_tokens')
          .select('*')
          .eq('company_id', companyId)
          .eq('provider', provider)
          .single();

        if (tokenError || !tokenData?.refresh_token) {
          throw new Error('No refresh token available');
        }

        // Refresh the token
        const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: tokenData.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.json();
          console.error('Token refresh error:', error);
          throw new Error('Failed to refresh token');
        }

        const tokens = await tokenResponse.json();
        const expiresAt = tokens.expires_in 
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null;

        // Update stored token
        await supabase
          .from('company_oauth_tokens')
          .update({
            access_token: tokens.access_token,
            token_expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tokenData.id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            access_token: tokens.access_token,
            expires_at: expiresAt,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'disconnect': {
        if (!companyId || !service) {
          throw new Error('companyId and service are required');
        }

        const providerMap = {
          ads: 'google_ads',
          analytics: 'google_analytics',
          search_console: 'google_search_console',
        };
        const provider = providerMap[service];

        await supabase
          .from('company_oauth_tokens')
          .delete()
          .eq('company_id', companyId)
          .eq('provider', provider);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Google OAuth error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
