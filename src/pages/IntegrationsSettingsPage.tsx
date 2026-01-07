import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HubSpotIntegration } from '@/components/settings/HubSpotIntegration';
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
      </div>
    </div>
  );
};

export default IntegrationsSettingsPage;
