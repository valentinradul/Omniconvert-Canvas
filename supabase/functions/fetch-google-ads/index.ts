import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_ADS_API_BASE = "https://googleads.googleapis.com/v16";

interface GoogleAdsConfig {
  customerId: string;
  developerToken: string;
  selectedCampaigns: string[];
  dateRangePreset: 'last_7d' | 'last_30d' | 'last_90d' | 'custom';
  customDateRange?: { from: string; to: string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, companyId, accessToken, refreshToken, customerId, developerToken, config } = body;

    // Verify user has access to company
    const { data: membership } = await supabase
      .from("company_members")
      .select("role")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: any;

    switch (action) {
      case "test-connection":
        result = await testConnection(accessToken, customerId, developerToken);
        break;

      case "get-campaigns":
        result = await getCampaigns(accessToken, customerId, developerToken);
        break;

      case "save-config":
        result = await saveConfig(supabase, companyId, accessToken, refreshToken, customerId, developerToken, config);
        break;

      case "sync":
        result = await syncCampaignData(supabase, companyId);
        break;

      case "disconnect":
        result = await disconnectIntegration(supabase, companyId);
        break;

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in fetch-google-ads:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function testConnection(accessToken: string, customerId: string, developerToken: string) {
  const cleanCustomerId = customerId.replace(/-/g, '');
  
  const response = await fetch(
    `${GOOGLE_ADS_API_BASE}/customers/${cleanCustomerId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('Google Ads API error:', error);
    throw new Error(error.error?.message || "Failed to connect to Google Ads");
  }

  const data = await response.json();
  return { success: true, accountName: data.descriptiveName || cleanCustomerId };
}

async function getCampaigns(accessToken: string, customerId: string, developerToken: string) {
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

  const response = await fetch(
    `${GOOGLE_ADS_API_BASE}/customers/${cleanCustomerId}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('Google Ads API error:', error);
    throw new Error(error.error?.message || "Failed to fetch campaigns");
  }

  const data = await response.json();
  const campaigns = (data[0]?.results || []).map((result: any) => ({
    id: result.campaign.id,
    name: result.campaign.name,
    status: result.campaign.status,
    channelType: result.campaign.advertisingChannelType,
  }));

  return { campaigns };
}

async function saveConfig(
  supabase: any,
  companyId: string,
  accessToken: string,
  refreshToken: string,
  customerId: string,
  developerToken: string,
  config: GoogleAdsConfig
) {
  // Upsert integration record
  const { data: existing } = await supabase
    .from("company_integrations")
    .select("id")
    .eq("company_id", companyId)
    .eq("integration_type", "google_ads")
    .maybeSingle();

  const credentials = JSON.stringify({
    accessToken,
    refreshToken,
    developerToken,
  });

  const integrationData = {
    company_id: companyId,
    integration_type: "google_ads",
    encrypted_credentials: credentials, // In production, encrypt this!
    config: { ...config, customerId },
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await supabase
      .from("company_integrations")
      .update(integrationData)
      .eq("id", existing.id);
  } else {
    await supabase.from("company_integrations").insert(integrationData);
  }

  return { success: true };
}

async function syncCampaignData(supabase: any, companyId: string) {
  // Get integration config
  const { data: integration, error: intError } = await supabase
    .from("company_integrations")
    .select("*")
    .eq("company_id", companyId)
    .eq("integration_type", "google_ads")
    .single();

  if (intError || !integration) {
    throw new Error("Google Ads integration not configured");
  }

  const credentials = JSON.parse(integration.encrypted_credentials);
  const config = integration.config as GoogleAdsConfig;
  const cleanCustomerId = config.customerId.replace(/-/g, '');

  // Calculate date range
  const { since, until } = getDateRange(config.dateRangePreset, config.customDateRange);

  // Create sync log entry
  const { data: syncLog } = await supabase
    .from("integration_sync_log")
    .insert({
      company_id: companyId,
      integration_id: integration.id,
      sync_type: "manual",
      status: "running",
    })
    .select()
    .single();

  try {
    // Build campaign filter
    const campaignFilter = config.selectedCampaigns.length > 0
      ? `AND campaign.id IN (${config.selectedCampaigns.join(',')})`
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
          'Authorization': `Bearer ${credentials.accessToken}`,
          'developer-token': credentials.developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to fetch insights");
    }

    const data = await response.json();
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
        channel_source: "Google",
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
        .from("marketing_campaign_metrics")
        .select("id")
        .eq("company_id", companyId)
        .eq("campaign_id", result.campaign.id.toString())
        .eq("date_reported", result.segments.date)
        .eq("channel_source", "Google")
        .maybeSingle();

      if (existingMetric) {
        await supabase
          .from("marketing_campaign_metrics")
          .update(metricData)
          .eq("id", existingMetric.id);
        recordsUpdated++;
      } else {
        await supabase.from("marketing_campaign_metrics").insert(metricData);
        recordsCreated++;
      }
    }

    // Update sync log
    await supabase
      .from("integration_sync_log")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        records_processed: results.length,
        records_created: recordsCreated,
        records_updated: recordsUpdated,
      })
      .eq("id", syncLog.id);

    // Update last sync time
    await supabase
      .from("company_integrations")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", integration.id);

    return {
      success: true,
      campaignsProcessed: results.length,
      recordsCreated,
      recordsUpdated,
    };

  } catch (error: any) {
    // Update sync log with error
    if (syncLog) {
      await supabase
        .from("integration_sync_log")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: error.message,
        })
        .eq("id", syncLog.id);
    }
    throw error;
  }
}

function getDateRange(preset: string, customRange?: { from: string; to: string }) {
  const now = new Date();
  let since: string;
  let until: string = now.toISOString().split('T')[0];

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
    case 'custom':
      since = customRange?.from || until;
      until = customRange?.to || until;
      break;
    default:
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  return { since, until };
}

async function disconnectIntegration(supabase: any, companyId: string) {
  await supabase
    .from("company_integrations")
    .delete()
    .eq("company_id", companyId)
    .eq("integration_type", "google_ads");

  return { success: true };
}
