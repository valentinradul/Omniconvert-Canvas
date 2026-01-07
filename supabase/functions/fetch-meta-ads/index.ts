import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const META_GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

interface MetaAdsConfig {
  adAccountId: string;
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
    const { action, companyId, accessToken, adAccountId, config } = body;

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
        result = await testConnection(accessToken, adAccountId);
        break;

      case "get-campaigns":
        result = await getCampaigns(accessToken, adAccountId);
        break;

      case "save-config":
        result = await saveConfig(supabase, companyId, accessToken, adAccountId, config);
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
    console.error("Error in fetch-meta-ads:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function testConnection(accessToken: string, adAccountId: string) {
  const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  
  const response = await fetch(
    `${META_GRAPH_API_BASE}/${accountId}?fields=name,account_status&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to connect to Meta Ads");
  }

  const data = await response.json();
  return { success: true, accountName: data.name };
}

async function getCampaigns(accessToken: string, adAccountId: string) {
  const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  
  const response = await fetch(
    `${META_GRAPH_API_BASE}/${accountId}/campaigns?fields=id,name,status,objective&limit=100&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch campaigns");
  }

  const data = await response.json();
  return { campaigns: data.data || [] };
}

async function saveConfig(
  supabase: any,
  companyId: string,
  accessToken: string,
  adAccountId: string,
  config: MetaAdsConfig
) {
  // Upsert integration record
  const { data: existing } = await supabase
    .from("company_integrations")
    .select("id")
    .eq("company_id", companyId)
    .eq("integration_type", "meta_ads")
    .maybeSingle();

  const integrationData = {
    company_id: companyId,
    integration_type: "meta_ads",
    encrypted_credentials: accessToken, // In production, encrypt this!
    config: { ...config, adAccountId },
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
    .eq("integration_type", "meta_ads")
    .single();

  if (intError || !integration) {
    throw new Error("Meta Ads integration not configured");
  }

  const accessToken = integration.encrypted_credentials;
  const config = integration.config as MetaAdsConfig;
  const accountId = config.adAccountId.startsWith('act_') 
    ? config.adAccountId 
    : `act_${config.adAccountId}`;

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
    // Fetch insights for selected campaigns
    const campaignFilter = config.selectedCampaigns.length > 0
      ? `&filtering=[{"field":"campaign.id","operator":"IN","value":${JSON.stringify(config.selectedCampaigns)}}]`
      : '';

    const insightsUrl = `${META_GRAPH_API_BASE}/${accountId}/insights?` +
      `level=campaign` +
      `&fields=campaign_id,campaign_name,spend,impressions,clicks,actions` +
      `&time_range={"since":"${since}","until":"${until}"}` +
      `&time_increment=1` +
      `${campaignFilter}` +
      `&access_token=${accessToken}`;

    const response = await fetch(insightsUrl);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to fetch insights");
    }

    const insightsData = await response.json();
    const insights = insightsData.data || [];

    let recordsCreated = 0;
    let recordsUpdated = 0;

    // Process each insight record
    for (const insight of insights) {
      const conversions = extractConversions(insight.actions);
      const impressions = parseInt(insight.impressions) || 0;
      const clicks = parseInt(insight.clicks) || 0;
      const spend = parseFloat(insight.spend) || 0;
      
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpc = clicks > 0 ? spend / clicks : 0;
      const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;

      const metricData = {
        company_id: companyId,
        channel_source: "Meta",
        campaign_id: insight.campaign_id,
        campaign_name: insight.campaign_name,
        date_reported: insight.date_start,
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
        .eq("campaign_id", insight.campaign_id)
        .eq("date_reported", insight.date_start)
        .eq("channel_source", "Meta")
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
        records_processed: insights.length,
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
      campaignsProcessed: insights.length,
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

function extractConversions(actions: any[]): number {
  if (!actions || !Array.isArray(actions)) return 0;

  const conversionTypes = [
    'omni_purchase',
    'purchase',
    'lead',
    'complete_registration',
    'submit_application',
  ];

  return actions
    .filter(action => conversionTypes.includes(action.action_type))
    .reduce((sum, action) => sum + (parseInt(action.value) || 0), 0);
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
    .eq("integration_type", "meta_ads");

  return { success: true };
}
