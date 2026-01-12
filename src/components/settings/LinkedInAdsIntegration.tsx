import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Unlink, 
  RefreshCw, 
  Settings2, 
  CheckCircle2, 
  Loader2, 
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useOAuth } from '@/hooks/useOAuth';
import { useCompany } from '@/context/company/CompanyContext';
import { supabase } from '@/integrations/supabase/client';

type WizardStep = 'connect' | 'configure' | 'complete';

interface LinkedInAdsCampaign {
  id: string;
  name: string;
  status: string;
  type?: string;
}

interface LinkedInAdsConfig {
  accountId: string;
  selectedCampaigns: string[];
  dateRangePreset: 'last_7d' | 'last_30d' | 'last_90d';
}

export const LinkedInAdsIntegration: React.FC = () => {
  const { currentCompany, userCompanyRole } = useCompany();
  const { 
    isConnected: isOAuthConnected, 
    isLoading: isOAuthLoading, 
    isConnecting, 
    connect, 
    disconnect: oauthDisconnect,
    getAccessToken 
  } = useOAuth('linkedin_ads');

  const [wizardStep, setWizardStep] = useState<WizardStep>('connect');
  const [accountId, setAccountId] = useState('');
  const [campaigns, setCampaigns] = useState<LinkedInAdsCampaign[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [dateRangePreset, setDateRangePreset] = useState<'last_7d' | 'last_30d' | 'last_90d'>('last_30d');
  const [isFetchingCampaigns, setIsFetchingCampaigns] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [integrationConfig, setIntegrationConfig] = useState<LinkedInAdsConfig | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const canManage = userCompanyRole === 'owner' || userCompanyRole === 'admin';

  // Load existing config
  useEffect(() => {
    const loadConfig = async () => {
      if (!currentCompany?.id) return;
      
      const { data } = await supabase
        .from('company_integrations')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('integration_type', 'linkedin_ads')
        .maybeSingle();

      if (data) {
        const config = data.config as any;
        setIntegrationConfig(config);
        setAccountId(config?.accountId || '');
        setSelectedCampaigns(config?.selectedCampaigns || []);
        setDateRangePreset(config?.dateRangePreset || 'last_30d');
        setLastSyncAt(data.last_sync_at);
        
        if (isOAuthConnected && config?.accountId) {
          setWizardStep('complete');
        }
      }
    };

    loadConfig();
  }, [currentCompany?.id, isOAuthConnected]);

  const handleConnectOAuth = async () => {
    await connect();
  };

  const handleFetchCampaigns = async () => {
    if (!accountId.trim()) {
      toast.error('Please enter your Ad Account ID');
      return;
    }

    setIsFetchingCampaigns(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        toast.error('Please reconnect your LinkedIn account');
        return;
      }

      const { data, error } = await supabase.functions.invoke('fetch-linkedin-ads', {
        body: {
          action: 'get-campaigns',
          companyId: currentCompany?.id,
          accessToken,
          accountId,
        },
      });

      if (error || !data?.campaigns) {
        throw new Error(data?.error || 'Failed to fetch campaigns');
      }

      setCampaigns(data.campaigns);
      setSelectedCampaigns(data.campaigns.map((c: LinkedInAdsCampaign) => c.id));
      setWizardStep('configure');
      toast.success('Campaigns loaded!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch campaigns');
    } finally {
      setIsFetchingCampaigns(false);
    }
  };

  const handleSaveConfig = async () => {
    if (selectedCampaigns.length === 0) {
      toast.error('Please select at least one campaign');
      return;
    }

    try {
      const accessToken = await getAccessToken();
      
      const { error } = await supabase.functions.invoke('fetch-linkedin-ads', {
        body: {
          action: 'save-config',
          companyId: currentCompany?.id,
          accessToken,
          accountId,
          config: {
            accountId,
            selectedCampaigns,
            dateRangePreset,
          },
        },
      });

      if (error) throw error;

      setIntegrationConfig({ accountId, selectedCampaigns, dateRangePreset });
      setWizardStep('complete');
      toast.success('Configuration saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save configuration');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-linkedin-ads', {
        body: { action: 'sync', companyId: currentCompany?.id },
      });

      if (error) throw error;

      setLastSyncAt(new Date().toISOString());
      toast.success(`Synced ${data?.recordsCreated || 0} records`);
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await supabase.functions.invoke('fetch-linkedin-ads', {
        body: { action: 'disconnect', companyId: currentCompany?.id },
      });
      await oauthDisconnect();
      setWizardStep('connect');
      setIntegrationConfig(null);
      setAccountId('');
      setCampaigns([]);
      setSelectedCampaigns([]);
    } catch (err) {
      toast.error('Failed to disconnect');
    }
  };

  if (isOAuthLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Connected and configured
  if (wizardStep === 'complete' && isOAuthConnected && integrationConfig) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
            <span className="text-sm text-muted-foreground">
              Account: {integrationConfig.accountId}
            </span>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setWizardStep('connect')}>
                <Settings2 className="h-4 w-4 mr-1" />
                Configure
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Unlink className="h-4 w-4 mr-1" />
                    Disconnect
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect LinkedIn Ads?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the integration. Existing data will not be deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDisconnect} className="bg-red-600 hover:bg-red-700">
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Sync Status</h4>
            {lastSyncAt && (
              <p className="text-sm text-muted-foreground">
                Last synced: {format(new Date(lastSyncAt), 'MMM d, yyyy h:mm a')}
              </p>
            )}
          </div>
          <Button onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Campaigns:</span>
            <span className="ml-2 font-medium">{integrationConfig.selectedCampaigns?.length || 0}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Date Range:</span>
            <span className="ml-2 font-medium">
              {integrationConfig.dateRangePreset === 'last_7d' ? 'Last 7 days' :
               integrationConfig.dateRangePreset === 'last_30d' ? 'Last 30 days' : 'Last 90 days'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // OAuth connected, needs Account ID
  if (isOAuthConnected && wizardStep !== 'configure') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="font-medium">LinkedIn Account Connected</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountId">Ad Account ID</Label>
          <Input
            id="accountId"
            placeholder="e.g., 123456789"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Find in LinkedIn Campaign Manager → Account Assets
          </p>
        </div>

        <Button 
          onClick={handleFetchCampaigns}
          disabled={isFetchingCampaigns || !accountId.trim()}
          className="w-full"
        >
          {isFetchingCampaigns ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ChevronRight className="h-4 w-4 mr-2" />}
          {isFetchingCampaigns ? 'Loading...' : 'Load Campaigns'}
        </Button>
      </div>
    );
  }

  // Campaign selection
  if (wizardStep === 'configure' && isOAuthConnected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Select Campaigns</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedCampaigns(
              selectedCampaigns.length === campaigns.length ? [] : campaigns.map(c => c.id)
            )}
          >
            {selectedCampaigns.length === campaigns.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>

        <div className="border rounded-lg max-h-48 overflow-y-auto">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50">
              <Checkbox
                checked={selectedCampaigns.includes(campaign.id)}
                onCheckedChange={() => {
                  setSelectedCampaigns(prev => 
                    prev.includes(campaign.id) ? prev.filter(id => id !== campaign.id) : [...prev, campaign.id]
                  );
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{campaign.name}</p>
                <p className="text-xs text-muted-foreground">{campaign.status}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label>Date Range</Label>
          <Select value={dateRangePreset} onValueChange={(v: any) => setDateRangePreset(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7d">Last 7 days</SelectItem>
              <SelectItem value="last_30d">Last 30 days</SelectItem>
              <SelectItem value="last_90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setWizardStep('connect')}>Back</Button>
          <Button onClick={handleSaveConfig} className="flex-1">Save & Connect</Button>
        </div>
      </div>
    );
  }

  // Initial connect
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Connect your LinkedIn account to import campaign data from LinkedIn Ads.
      </p>
      
      <Button onClick={handleConnectOAuth} disabled={isConnecting} className="w-full" variant="outline">
        {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : (
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        )}
        {isConnecting ? 'Connecting...' : 'Connect with LinkedIn'}
      </Button>
    </div>
  );
};
