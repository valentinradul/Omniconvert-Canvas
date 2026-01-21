import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HubSpotIntegration } from '@/components/settings/HubSpotIntegration';
import { MetaAdsIntegration } from '@/components/settings/MetaAdsIntegration';
import { GoogleAdsIntegration } from '@/components/settings/GoogleAdsIntegration';
import { GoogleAnalyticsIntegration } from '@/components/settings/GoogleAnalyticsIntegration';
import { LinkedInAdsIntegration } from '@/components/settings/LinkedInAdsIntegration';
import { GoogleSearchConsoleIntegration } from '@/components/settings/GoogleSearchConsoleIntegration';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plug, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useOAuth } from '@/hooks/useOAuth';
import { useHubSpotIntegration } from '@/hooks/useHubSpotIntegration';
import { useSyncGoogleAnalytics } from '@/hooks/useSyncGoogleAnalytics';
import { useSyncGoogleSearchConsole } from '@/hooks/useSyncGoogleSearchConsole';
import { useSyncHubSpot } from '@/hooks/useSyncHubSpot';
import { format } from 'date-fns';

const IntegrationsSettingsPage: React.FC = () => {
  const { isConnected: isGAConnected } = useOAuth('google_analytics');
  const { isConnected: isGSCConnected } = useOAuth('google_search_console');
  const { status: hubSpotStatus } = useHubSpotIntegration();
  const isHubSpotConnected = hubSpotStatus.isConnected;

  const syncGA = useSyncGoogleAnalytics();
  const syncGSC = useSyncGoogleSearchConsole();
  const syncHubSpot = useSyncHubSpot();

  const isSyncing = syncGA.isPending || syncGSC.isPending || syncHubSpot.isPending;
  const hasAnyConnection = isGAConnected || isGSCConnected || isHubSpotConnected;

  const connectedCount = [isGAConnected, isGSCConnected, isHubSpotConnected].filter(Boolean).length;

  const handleSyncAll = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dateRange = {
      startDate: format(startOfMonth, 'yyyy-MM-dd'),
      endDate: format(now, 'yyyy-MM-dd'),
    };

    if (isGAConnected) {
      syncGA.mutate(dateRange);
    }
    if (isGSCConnected) {
      syncGSC.mutate(dateRange);
    }
    if (isHubSpotConnected) {
      syncHubSpot.mutate(dateRange);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Plug className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Integrations</h1>
            <p className="text-muted-foreground">Connect third-party services to sync data automatically</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasAnyConnection && (
            <Badge variant="outline" className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              {connectedCount} connected
            </Badge>
          )}
          <Button
            onClick={handleSyncAll}
            disabled={!hasAnyConnection || isSyncing}
            className="bg-primary hover:bg-primary/90"
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync All
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img 
                src="https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png" 
                alt="HubSpot" 
                className="h-6 w-6"
              />
              HubSpot CRM
            </CardTitle>
            <CardDescription>
              Sync deals, contacts, and pipeline data from HubSpot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HubSpotIntegration />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1024px-Facebook_Logo_%282019%29.png" 
                alt="Meta" 
                className="h-6 w-6"
              />
              Meta Ads
            </CardTitle>
            <CardDescription>
              Sync campaign performance data from Facebook and Instagram Ads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetaAdsIntegration />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img 
                src="https://www.gstatic.com/images/branding/product/1x/ads_48dp.png" 
                alt="Google Ads" 
                className="h-6 w-6"
              />
              Google Ads
            </CardTitle>
            <CardDescription>
              Sync campaign performance data from Google Ads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleAdsIntegration />
          </CardContent>
        </Card>

        <GoogleAnalyticsIntegration />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img 
                src="https://content.linkedin.com/content/dam/me/business/en-us/amp/brand-site/v2/bg/LI-Bug.svg.original.svg" 
                alt="LinkedIn" 
                className="h-6 w-6"
              />
              LinkedIn Ads
            </CardTitle>
            <CardDescription>
              Sync campaign performance data from LinkedIn Campaign Manager
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkedInAdsIntegration />
          </CardContent>
        </Card>

        <GoogleSearchConsoleIntegration />
      </div>
    </div>
  );
};

export default IntegrationsSettingsPage;
