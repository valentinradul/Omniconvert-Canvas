import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

interface LinkedInAdsConfig {
  accountId: string;
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
    const { action, companyId, accessToken, accountId, config } = body;

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
        result = await testConnection(accessToken, accountId);
        break;

      case "get-campaigns":
        result = await getCampaigns(accessToken, accountId);
        break;

      case "save-config":
        result = await saveConfig(supabase, companyId, accessToken, accountId, config);
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
    console.error("Error in fetch-linkedin-ads:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function testConnection(accessToken: string, accountId: string) {
  const response = await fetch(
    `${LINKEDIN_API_BASE}/adAccountsV2/${accountId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("LinkedIn API error:", error);
    throw new Error("Failed to connect to LinkedIn Ads");
  }

  const data = await response.json();
  return { success: true, accountName: data.name || `Account ${accountId}` };
}

async function getCampaigns(accessToken: string, accountId: string) {
  const response = await fetch(
    `${LINKEDIN_API_BASE}/adCampaignsV2?q=search&search.account.values[0]=urn:li:sponsoredAccount:${accountId}&count=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("LinkedIn API error:", error);
    throw new Error("Failed to fetch campaigns");
  }

  const data = await response.json();
  const campaigns = (data.elements || []).map((campaign: any) => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    type: campaign.type,
  }));

  return { campaigns };
}

async function saveConfig(
  supabase: any,
  companyId: string,
  accessToken: string,
  accountId: string,
  config: LinkedInAdsConfig
) {
  // Upsert integration record
  const { data: existing } = await supabase
    .from("company_integrations")
    .select("id")
    .eq("company_id", companyId)
    .eq("integration_type", "linkedin_ads")
    .maybeSingle();

  const integrationData = {
    company_id: companyId,
    integration_type: "linkedin_ads",
    encrypted_credentials: accessToken, // In production, encrypt this!
    config: { ...config, accountId },
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
    .eq("integration_type", "linkedin_ads")
    .single();

  if (intError || !integration) {
    throw new Error("LinkedIn Ads integration not configured");
  }

  const accessToken = integration.encrypted_credentials;
  const config = integration.config as LinkedInAdsConfig;
  const accountId = config.accountId;

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
    // Build campaign filter for selected campaigns
    const campaignUrns = config.selectedCampaigns
      .map((id) => `urn:li:sponsoredCampaign:${id}`)
      .join(",");

    // Fetch analytics for campaigns
    const analyticsUrl = `${LINKEDIN_API_BASE}/adAnalyticsV2?q=analytics&pivot=CAMPAIGN&dateRange.start.day=${getDay(since)}&dateRange.start.month=${getMonth(since)}&dateRange.start.year=${getYear(since)}&dateRange.end.day=${getDay(until)}&dateRange.end.month=${getMonth(until)}&dateRange.end.year=${getYear(until)}&timeGranularity=DAILY&campaigns=${campaignUrns}&fields=impressions,clicks,costInLocalCurrency,externalWebsiteConversions`;

    const response = await fetch(analyticsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("LinkedIn Analytics API error:", error);
      throw new Error("Failed to fetch analytics data");
    }

    const analyticsData = await response.json();
    const records = analyticsData.elements || [];

    // Get campaign names
    const campaignNames = await getCampaignNames(accessToken, config.selectedCampaigns);

    let recordsCreated = 0;
    let recordsUpdated = 0;

    // Process each analytics record
    for (const record of records) {
      const campaignId = extractCampaignId(record.pivotValue);
      const dateReported = formatDate(record.dateRange?.start);
      
      const impressions = record.impressions || 0;
      const clicks = record.clicks || 0;
      const spend = record.costInLocalCurrency?.amount 
        ? parseFloat(record.costInLocalCurrency.amount) / 100 
        : 0;
      const conversions = record.externalWebsiteConversions || 0;

      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpc = clicks > 0 ? spend / clicks : 0;
      const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;

      const metricData = {
        company_id: companyId,
        channel_source: "LinkedIn",
        campaign_id: campaignId,
        campaign_name: campaignNames[campaignId] || `Campaign ${campaignId}`,
        date_reported: dateReported,
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
        .eq("campaign_id", campaignId)
        .eq("date_reported", dateReported)
        .eq("channel_source", "LinkedIn")
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
        records_processed: records.length,
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
      campaignsProcessed: config.selectedCampaigns.length,
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

async function getCampaignNames(accessToken: string, campaignIds: string[]): Promise<Record<string, string>> {
  const names: Record<string, string> = {};
  
  for (const id of campaignIds) {
    try {
      const response = await fetch(
        `${LINKEDIN_API_BASE}/adCampaignsV2/${id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        names[id] = data.name || `Campaign ${id}`;
      }
    } catch (e) {
      console.error(`Failed to get name for campaign ${id}:`, e);
    }
  }
  
  return names;
}

function extractCampaignId(urn: string): string {
  // Extract campaign ID from URN like "urn:li:sponsoredCampaign:123456"
  const parts = urn?.split(":") || [];
  return parts[parts.length - 1] || urn;
}

function formatDate(dateObj: { year: number; month: number; day: number } | undefined): string {
  if (!dateObj) return new Date().toISOString().split('T')[0];
  return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
}

function getDay(dateStr: string): number {
  return parseInt(dateStr.split('-')[2]);
}

function getMonth(dateStr: string): number {
  return parseInt(dateStr.split('-')[1]);
}

function getYear(dateStr: string): number {
  return parseInt(dateStr.split('-')[0]);
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
    .eq("integration_type", "linkedin_ads");

  return { success: true };
}
