import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const META_AUTH_URL = 'https://www.facebook.com/v19.0/dialog/oauth';
const META_TOKEN_URL = 'https://graph.facebook.com/v19.0/oauth/access_token';
const META_GRAPH_URL = 'https://graph.facebook.com/v19.0';

const META_SCOPES = [
  'ads_management',
  'ads_read',
  'business_management',
].join(',');

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

    const appId = Deno.env.get('META_APP_ID');
    const appSecret = Deno.env.get('META_APP_SECRET');

    if (!appId || !appSecret) {
      return new Response(
        JSON.stringify({ 
          error: 'Meta OAuth not configured',
          message: 'Please configure META_APP_ID and META_APP_SECRET secrets'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: OAuthRequest = await req.json();
    const { action, companyId, code, state, redirectUri } = body;

    console.log(`Meta OAuth action: ${action}`, { companyId });

    switch (action) {
      case 'start': {
        if (!companyId || !redirectUri) {
          throw new Error('companyId and redirectUri are required');
        }

        const stateData = JSON.stringify({ companyId });
        const encodedState = btoa(stateData);

        const authUrl = new URL(META_AUTH_URL);
        authUrl.searchParams.set('client_id', appId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', META_SCOPES);
        authUrl.searchParams.set('state', encodedState);
        authUrl.searchParams.set('response_type', 'code');

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

        // Exchange code for short-lived token
        const tokenUrl = new URL(META_TOKEN_URL);
        tokenUrl.searchParams.set('client_id', appId);
        tokenUrl.searchParams.set('client_secret', appSecret);
        tokenUrl.searchParams.set('redirect_uri', redirectUri);
        tokenUrl.searchParams.set('code', code);

        const tokenResponse = await fetch(tokenUrl.toString());

        if (!tokenResponse.ok) {
          const error = await tokenResponse.json();
          console.error('Token exchange error:', error);
          throw new Error(error.error?.message || 'Failed to exchange code for tokens');
        }

        const shortLivedToken = await tokenResponse.json();

        // Exchange for long-lived token
        const longLivedUrl = new URL(META_TOKEN_URL);
        longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
        longLivedUrl.searchParams.set('client_id', appId);
        longLivedUrl.searchParams.set('client_secret', appSecret);
        longLivedUrl.searchParams.set('fb_exchange_token', shortLivedToken.access_token);

        const longLivedResponse = await fetch(longLivedUrl.toString());
        
        if (!longLivedResponse.ok) {
          console.error('Long-lived token exchange failed');
          // Use short-lived token as fallback
        }

        const finalToken = longLivedResponse.ok 
          ? await longLivedResponse.json() 
          : shortLivedToken;

        const expiresAt = finalToken.expires_in 
          ? new Date(Date.now() + finalToken.expires_in * 1000).toISOString()
          : null;

        // Get user's ad accounts for display
        let accountName = 'Meta Ads';
        try {
          const meResponse = await fetch(
            `${META_GRAPH_URL}/me?fields=name&access_token=${finalToken.access_token}`
          );
          if (meResponse.ok) {
            const meData = await meResponse.json();
            accountName = meData.name;
          }
        } catch (e) {
          console.error('Failed to get user info:', e);
        }

        // Upsert OAuth token
        const { error: upsertError } = await supabase
          .from('company_oauth_tokens')
          .upsert({
            company_id: stateData.companyId,
            provider: 'meta_ads',
            access_token: finalToken.access_token,
            refresh_token: null, // Meta uses long-lived tokens instead
            token_expires_at: expiresAt,
            scopes: META_SCOPES.split(','),
            account_name: accountName,
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
            provider: 'meta_ads',
            accountName,
            message: 'Successfully connected to Meta' 
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
          .eq('provider', 'meta_ads');

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Meta OAuth error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
