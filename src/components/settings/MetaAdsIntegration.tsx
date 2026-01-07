import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Link2, 
  Unlink, 
  RefreshCw, 
  Settings2, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ChevronRight,
  ChevronLeft,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  useMetaAdsIntegration, 
  MetaAdsCampaign,
  MetaAdsConfig 
} from '@/hooks/useMetaAdsIntegration';
import { useCompany } from '@/context/company/CompanyContext';

type WizardStep = 'connect' | 'campaigns' | 'daterange' | 'complete';

export const MetaAdsIntegration: React.FC = () => {
  const { currentCompany, userCompanyRole } = useCompany();
  const {
    status,
    syncHistory,
    isLoading,
    isSyncing,
    testConnection,
    getCampaigns,
    saveConfig,
    syncNow,
    disconnect,
    refetch
  } = useMetaAdsIntegration();

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>('connect');
  const [accessToken, setAccessToken] = useState('');
  const [adAccountId, setAdAccountId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Data state
  const [campaigns, setCampaigns] = useState<MetaAdsCampaign[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [dateRangePreset, setDateRangePreset] = useState<'last_7d' | 'last_30d' | 'last_90d' | 'custom'>('last_30d');

  // Sync state
  const [syncStatus, setSyncStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [syncResult, setSyncResult] = useState<{
    campaignsProcessed?: number;
    recordsCreated?: number;
    recordsUpdated?: number;
  } | null>(null);

  const canManage = userCompanyRole === 'owner' || userCompanyRole === 'admin';

  // Initialize from existing config
  useEffect(() => {
    if (status.isConnected && status.config) {
      setAdAccountId(status.config.adAccountId || '');
      setSelectedCampaigns(status.config.selectedCampaigns || []);
      setDateRangePreset(status.config.dateRangePreset || 'last_30d');
      setWizardStep('complete');
    }
  }, [status.isConnected, status.config]);

  // Connect with access token
  const handleConnect = async () => {
    if (!accessToken.trim()) {
      toast.error('Please enter your Meta Access Token');
      return;
    }
    if (!adAccountId.trim()) {
      toast.error('Please enter your Ad Account ID');
      return;
    }

    setIsConnecting(true);
    try {
      // Test connection
      await testConnection(accessToken, adAccountId);
      
      // Fetch campaigns
      const fetchedCampaigns = await getCampaigns(accessToken, adAccountId);
      setCampaigns(fetchedCampaigns);
      
      // Select all by default
      setSelectedCampaigns(fetchedCampaigns.map(c => c.id));
      
      toast.success('Connected to Meta Ads successfully!');
      setWizardStep('campaigns');
    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error(error.message || 'Failed to connect to Meta Ads');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle campaign selection
  const handleCampaignToggle = (campaignId: string) => {
    setSelectedCampaigns(prev => {
      if (prev.includes(campaignId)) {
        return prev.filter(id => id !== campaignId);
      }
      return [...prev, campaignId];
    });
  };

  const handleSelectAllCampaigns = () => {
    if (selectedCampaigns.length === campaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(campaigns.map(c => c.id));
    }
  };

  // Save configuration
  const handleSaveConfig = async () => {
    if (selectedCampaigns.length === 0) {
      toast.error('Please select at least one campaign');
      return;
    }

    setIsSaving(true);
    try {
      const config: MetaAdsConfig = {
        adAccountId,
        selectedCampaigns,
        dateRangePreset,
      };
      
      await saveConfig(accessToken, adAccountId, config);
      toast.success('Configuration saved successfully!');
      setWizardStep('complete');
      setAccessToken(''); // Clear token after saving
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // Run sync
  const handleSync = async () => {
    setSyncStatus('running');
    setSyncResult(null);
    try {
      const result = await syncNow();
      setSyncResult(result);
      setSyncStatus('completed');
      toast.success('Sync completed successfully!');
    } catch (error: any) {
      console.error('Sync error:', error);
      setSyncStatus('failed');
      toast.error(error.message || 'Sync failed');
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    try {
      await disconnect();
      // Reset all state
      setWizardStep('connect');
      setAccessToken('');
      setAdAccountId('');
      setCampaigns([]);
      setSelectedCampaigns([]);
      setDateRangePreset('last_30d');
      setSyncStatus('idle');
      setSyncResult(null);
      toast.success('Meta Ads disconnected');
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast.error(error.message || 'Failed to disconnect');
    }
  };

  // Reconfigure
  const handleReconfigure = async () => {
    setWizardStep('connect');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Connected state - show status and sync controls
  if (wizardStep === 'complete' && status.isConnected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
            {status.config?.adAccountId && (
              <span className="text-sm text-muted-foreground">
                Account: {status.config.adAccountId}
              </span>
            )}
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReconfigure}>
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
                    <AlertDialogTitle>Disconnect Meta Ads?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the Meta Ads integration and stop syncing campaign data. Your existing data will not be deleted.
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

        {/* Sync Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Sync Status</h4>
              {status.lastSyncAt && (
                <p className="text-sm text-muted-foreground">
                  Last synced: {format(new Date(status.lastSyncAt), 'MMM d, yyyy h:mm a')}
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

          {syncStatus !== 'idle' && syncResult && (
            <div className={`p-3 rounded-lg ${
              syncStatus === 'completed' ? 'bg-green-50 border border-green-200' :
              syncStatus === 'failed' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center gap-2">
                {syncStatus === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : syncStatus === 'failed' ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                )}
                <span className="text-sm font-medium">
                  {syncStatus === 'completed' ? 'Sync completed' :
                   syncStatus === 'failed' ? 'Sync failed' : 'Syncing...'}
                </span>
              </div>
              {syncResult && (
                <p className="text-sm text-muted-foreground mt-1">
                  {syncResult.campaignsProcessed} campaigns processed, {syncResult.recordsCreated} created, {syncResult.recordsUpdated} updated
                </p>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Configuration Summary */}
        <div className="space-y-3">
          <h4 className="font-medium">Configuration</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Campaigns:</span>
              <span className="ml-2 font-medium">{status.config?.selectedCampaigns?.length || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Date Range:</span>
              <span className="ml-2 font-medium">
                {status.config?.dateRangePreset === 'last_7d' ? 'Last 7 days' :
                 status.config?.dateRangePreset === 'last_30d' ? 'Last 30 days' :
                 status.config?.dateRangePreset === 'last_90d' ? 'Last 90 days' : 'Custom'}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Sync History */}
        <div className="space-y-3">
          <h4 className="font-medium">Recent Syncs</h4>
          {syncHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sync history yet</p>
          ) : (
            <div className="space-y-2">
              {syncHistory.slice(0, 5).map(log => (
                <div key={log.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    {log.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : log.status === 'failed' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{format(new Date(log.startedAt), 'MMM d, h:mm a')}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {log.recordsProcessed} processed, {log.recordsCreated} created
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Wizard UI
  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          {['Connect', 'Campaigns', 'Date Range'].map((step, index) => {
            const steps: WizardStep[] = ['connect', 'campaigns', 'daterange'];
            const currentIndex = steps.indexOf(wizardStep);
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;
            
            return (
              <div 
                key={step}
                className={`flex items-center gap-1 ${
                  isActive ? 'text-primary font-medium' : 
                  isCompleted ? 'text-green-600' : 'text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {index + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{step}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step: Connect */}
      {wizardStep === 'connect' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessToken">Meta Access Token</Label>
            <Input
              id="accessToken"
              type="password"
              placeholder="Enter your Meta Graph API access token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Generate a long-lived access token from the{' '}
              <a 
                href="https://developers.facebook.com/tools/explorer/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Meta Graph API Explorer
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adAccountId">Ad Account ID</Label>
            <Input
              id="adAccountId"
              placeholder="act_XXXXXXXXXX"
              value={adAccountId}
              onChange={(e) => setAdAccountId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Find your Ad Account ID in Meta Business Suite under Business Settings → Accounts → Ad Accounts
            </p>
          </div>

          <Button 
            onClick={handleConnect} 
            disabled={isConnecting || !accessToken.trim() || !adAccountId.trim()}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                Connect to Meta Ads
              </>
            )}
          </Button>
        </div>
      )}

      {/* Step: Campaigns */}
      {wizardStep === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Select Campaigns to Sync</h4>
            <Button variant="ghost" size="sm" onClick={handleSelectAllCampaigns}>
              {selectedCampaigns.length === campaigns.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="border rounded-lg max-h-64 overflow-y-auto">
            {campaigns.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No campaigns found in this ad account</p>
            ) : (
              campaigns.map(campaign => (
                <div 
                  key={campaign.id}
                  className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedCampaigns.includes(campaign.id)}
                    onCheckedChange={() => handleCampaignToggle(campaign.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {campaign.status} {campaign.objective && `• ${campaign.objective}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setWizardStep('connect')}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button 
              onClick={() => setWizardStep('daterange')}
              disabled={selectedCampaigns.length === 0}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Date Range */}
      {wizardStep === 'daterange' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Date Range for Syncing</Label>
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
            <p className="text-xs text-muted-foreground">
              Each sync will fetch data for the selected date range
            </p>
          </div>

          <Separator />

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Summary</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Ad Account: {adAccountId}</li>
              <li>• {selectedCampaigns.length} campaign(s) selected</li>
              <li>• Date range: {
                dateRangePreset === 'last_7d' ? 'Last 7 days' :
                dateRangePreset === 'last_30d' ? 'Last 30 days' : 'Last 90 days'
              }</li>
            </ul>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setWizardStep('campaigns')}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button onClick={handleSaveConfig} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Connect'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
