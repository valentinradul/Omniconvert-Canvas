import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HubSpotIntegration } from '@/components/settings/HubSpotIntegration';
import { MetaAdsIntegration } from '@/components/settings/MetaAdsIntegration';
import { GoogleAdsIntegration } from '@/components/settings/GoogleAdsIntegration';
import { GoogleAnalyticsIntegration } from '@/components/settings/GoogleAnalyticsIntegration';
import { LinkedInAdsIntegration } from '@/components/settings/LinkedInAdsIntegration';
import { GoogleSearchConsoleIntegration } from '@/components/settings/GoogleSearchConsoleIntegration';
import { Plug } from 'lucide-react';

const IntegrationsSettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Plug className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">Connect third-party services to sync data automatically</p>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img 
                src="https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg" 
                alt="Google Analytics" 
                className="h-6 w-6"
              />
              Google Analytics
            </CardTitle>
            <CardDescription>
              Sync website traffic and user behavior data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleAnalyticsIntegration />
          </CardContent>
        </Card>

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img 
                src="https://www.gstatic.com/images/branding/product/1x/search_console_48dp.png" 
                alt="Google Search Console" 
                className="h-6 w-6"
              />
              Google Search Console
            </CardTitle>
            <CardDescription>
              Sync organic search impressions, clicks, CTR, and position data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleSearchConsoleIntegration />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IntegrationsSettingsPage;
