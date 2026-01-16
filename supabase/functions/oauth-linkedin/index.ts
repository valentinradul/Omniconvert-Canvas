import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';

const LINKEDIN_SCOPES = [
  'r_ads',
  'r_ads_reporting',
  'rw_ads',
].join(' ');

interface OAuthRequest {
  action: 'start' | 'callback' | 'refresh' | 'disconnect';
  companyId?: string;
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

    const clientId = Deno.env.get('LINKEDIN_CLIENT_ID');
    const clientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ 
          error: 'LinkedIn OAuth not configured',
          message: 'Please configure LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET secrets'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: OAuthRequest = await req.json();
    const { action, companyId, code, state, redirectUri } = body;

    console.log(`LinkedIn OAuth action: ${action}`, { companyId });

    switch (action) {
      case 'start': {
        if (!companyId || !redirectUri) {
          throw new Error('companyId and redirectUri are required');
        }

        const stateData = JSON.stringify({ companyId, provider: 'linkedin_ads' });
        const encodedState = btoa(stateData);

        const authUrl = new URL(LINKEDIN_AUTH_URL);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', LINKEDIN_SCOPES);
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

        let stateData: { companyId: string };
        try {
          stateData = JSON.parse(atob(state));
        } catch {
          throw new Error('Invalid state parameter');
        }

        // Exchange code for tokens
        const tokenResponse = await fetch(LINKEDIN_TOKEN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
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

        // Upsert OAuth token
        const { error: upsertError } = await supabase
          .from('company_oauth_tokens')
          .upsert({
            company_id: stateData.companyId,
            provider: 'linkedin_ads',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: expiresAt,
            scopes: LINKEDIN_SCOPES.split(' '),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'company_id,provider',
          });

        if (upsertError) {
          console.error('Failed to save tokens:', upsertError);
          throw new Error('Failed to save OAuth tokens');
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            provider: 'linkedin_ads',
            message: 'Successfully connected to LinkedIn' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'refresh': {
        if (!companyId) {
          throw new Error('companyId is required');
        }

        // Get existing token
        const { data: tokenData, error: tokenError } = await supabase
          .from('company_oauth_tokens')
          .select('*')
          .eq('company_id', companyId)
          .eq('provider', 'linkedin_ads')
          .single();

        if (tokenError || !tokenData?.refresh_token) {
          throw new Error('No refresh token available');
        }

        // Refresh the token
        const tokenResponse = await fetch(LINKEDIN_TOKEN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tokenData.refresh_token,
            client_id: clientId,
            client_secret: clientSecret,
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
            refresh_token: tokens.refresh_token || tokenData.refresh_token,
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
        if (!companyId) {
          throw new Error('companyId is required');
        }

        await supabase
          .from('company_oauth_tokens')
          .delete()
          .eq('company_id', companyId)
          .eq('provider', 'linkedin_ads');

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
