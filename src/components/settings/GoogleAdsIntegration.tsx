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
  XCircle, 
  Loader2, 
  ChevronRight,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { useOAuth } from '@/hooks/useOAuth';
import { useCompany } from '@/context/company/CompanyContext';
import { supabase } from '@/integrations/supabase/client';

type WizardStep = 'connect' | 'configure' | 'complete';

interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: string;
  channelType?: string;
}

interface GoogleAdsConfig {
  customerId: string;
  selectedCampaigns: string[];
  dateRangePreset: 'last_7d' | 'last_30d' | 'last_90d';
}

export const GoogleAdsIntegration: React.FC = () => {
  const { currentCompany, userCompanyRole } = useCompany();
  const { 
    isConnected: isOAuthConnected, 
    isLoading: isOAuthLoading, 
    isConnecting, 
    connect, 
    disconnect: oauthDisconnect,
    getAccessToken,
    tokenData 
  } = useOAuth('google_ads');

  const [wizardStep, setWizardStep] = useState<WizardStep>('connect');
  const [customerId, setCustomerId] = useState('');
  const [developerToken, setDeveloperToken] = useState('');
  const [campaigns, setCampaigns] = useState<GoogleAdsCampaign[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [dateRangePreset, setDateRangePreset] = useState<'last_7d' | 'last_30d' | 'last_90d'>('last_30d');
  const [isFetchingCampaigns, setIsFetchingCampaigns] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [integrationConfig, setIntegrationConfig] = useState<GoogleAdsConfig | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);

  const canManage = userCompanyRole === 'owner' || userCompanyRole === 'admin';

  // Load existing integration config
  useEffect(() => {
    const loadConfig = async () => {
      if (!currentCompany?.id) return;
      
      const { data } = await supabase
        .from('company_integrations')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('integration_type', 'google_ads')
        .maybeSingle();

      if (data) {
        const config = data.config as any;
        setIntegrationConfig(config);
        setCustomerId(config?.customerId || '');
        setSelectedCampaigns(config?.selectedCampaigns || []);
        setDateRangePreset(config?.dateRangePreset || 'last_30d');
        setLastSyncAt(data.last_sync_at);
        
        if (isOAuthConnected && config?.customerId) {
          setWizardStep('complete');
        }
      }
    };

    loadConfig();
  }, [currentCompany?.id, isOAuthConnected]);

  // Load sync history
  useEffect(() => {
    const loadSyncHistory = async () => {
      if (!currentCompany?.id) return;

      const { data } = await supabase
        .from('integration_sync_log')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('started_at', { ascending: false })
        .limit(5);

      if (data) {
        setSyncHistory(data.filter(log => {
          // Filter for google_ads syncs
          return true; // We'd need to join with integrations to properly filter
        }));
      }
    };

    loadSyncHistory();
  }, [currentCompany?.id]);

  const handleConnectOAuth = async () => {
    await connect();
  };

  const handleFetchCampaigns = async () => {
    if (!customerId.trim()) {
      toast.error('Please enter your Customer ID');
      return;
    }

    setIsFetchingCampaigns(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        toast.error('Please reconnect your Google account');
        return;
      }

      const { data, error } = await supabase.functions.invoke('fetch-google-ads', {
        body: {
          action: 'get-campaigns',
          companyId: currentCompany?.id,
          accessToken,
          customerId,
        },
      });

      if (error || !data?.campaigns) {
        throw new Error(data?.error || 'Failed to fetch campaigns');
      }

      setCampaigns(data.campaigns);
      setSelectedCampaigns(data.campaigns.map((c: GoogleAdsCampaign) => c.id));
      setWizardStep('configure');
      toast.success('Campaigns loaded successfully!');
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
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
      
      const { error } = await supabase.functions.invoke('fetch-google-ads', {
        body: {
          action: 'save-config',
          companyId: currentCompany?.id,
          accessToken,
          customerId,
          config: {
            customerId,
            selectedCampaigns,
            dateRangePreset,
          },
        },
      });

      if (error) throw error;

      setIntegrationConfig({ customerId, selectedCampaigns, dateRangePreset });
      setWizardStep('complete');
      toast.success('Configuration saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save configuration');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-google-ads', {
        body: {
          action: 'sync',
          companyId: currentCompany?.id,
        },
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
      await supabase.functions.invoke('fetch-google-ads', {
        body: { action: 'disconnect', companyId: currentCompany?.id },
      });
      await oauthDisconnect();
      setWizardStep('connect');
      setIntegrationConfig(null);
      setCustomerId('');
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

  // Connected and configured state
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
              Customer ID: {integrationConfig.customerId}
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
                    <AlertDialogTitle>Disconnect Google Ads?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the Google Ads integration. Your existing data will not be deleted.
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

        <div className="space-y-4">
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
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="font-medium">Configuration</h4>
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
      </div>
    );
  }

  // OAuth connected but needs configuration
  if (isOAuthConnected && wizardStep !== 'configure') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="font-medium">Google Account Connected</span>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="customerId">Google Ads Customer ID</Label>
            <Input
              id="customerId"
              placeholder="123-456-7890"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Find your Customer ID in Google Ads under Settings → Account Settings
            </p>
          </div>

          <Button 
            onClick={handleFetchCampaigns}
            disabled={isFetchingCampaigns || !customerId.trim()}
            className="w-full"
          >
            {isFetchingCampaigns ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading Campaigns...
              </>
            ) : (
              <>
                <ChevronRight className="h-4 w-4 mr-2" />
                Load Campaigns
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Campaign selection step
  if (wizardStep === 'configure' && isOAuthConnected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Select Campaigns</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if (selectedCampaigns.length === campaigns.length) {
                setSelectedCampaigns([]);
              } else {
                setSelectedCampaigns(campaigns.map(c => c.id));
              }
            }}
          >
            {selectedCampaigns.length === campaigns.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>

        <div className="border rounded-lg max-h-48 overflow-y-auto">
          {campaigns.map(campaign => (
            <div 
              key={campaign.id}
              className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50"
            >
              <Checkbox
                checked={selectedCampaigns.includes(campaign.id)}
                onCheckedChange={() => {
                  setSelectedCampaigns(prev => 
                    prev.includes(campaign.id) 
                      ? prev.filter(id => id !== campaign.id)
                      : [...prev, campaign.id]
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
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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

  // Initial connect state
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Connect your Google account to import campaign data from Google Ads.
      </p>
      
      <Button 
        onClick={handleConnectOAuth}
        disabled={isConnecting}
        className="w-full"
        variant="outline"
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Connect with Google
          </>
        )}
      </Button>
    </div>
  );
};
