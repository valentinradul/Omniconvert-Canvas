import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { 
  Unlink, 
  RefreshCw, 
  Settings2, 
  CheckCircle2, 
  Loader2, 
  ChevronRight,
  CalendarIcon
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useOAuth } from '@/hooks/useOAuth';
import { useCompany } from '@/context/company/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

type WizardStep = 'connect' | 'configure' | 'complete';

interface MetaAdsCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  hasRecentDelivery?: boolean;
  recentImpressions?: number;
}

interface MetaAdsConfig {
  adAccountId: string;
  selectedCampaigns: string[];
  dateRangePreset: 'last_7d' | 'last_30d' | 'last_90d' | 'custom';
  customDateRange?: { from: string; to: string };
}

export const MetaAdsIntegration: React.FC = () => {
  const { currentCompany, userCompanyRole } = useCompany();
  const { 
    isConnected: isOAuthConnected, 
    isLoading: isOAuthLoading, 
    isConnecting, 
    connect, 
    disconnect: oauthDisconnect,
    getAccessToken 
  } = useOAuth('meta_ads');

  const [wizardStep, setWizardStep] = useState<WizardStep>('connect');
  const [adAccountId, setAdAccountId] = useState('');
  const [campaigns, setCampaigns] = useState<MetaAdsCampaign[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [dateRangePreset, setDateRangePreset] = useState<'last_7d' | 'last_30d' | 'last_90d' | 'custom'>('last_30d');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [isFetchingCampaigns, setIsFetchingCampaigns] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'PAUSED' | 'DELETED' | 'DELIVERED_30D' | 'DELIVERED_CUSTOM'>('all');
  const [integrationConfig, setIntegrationConfig] = useState<MetaAdsConfig | null>(null);
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
        .eq('integration_type', 'meta_ads')
        .maybeSingle();

      if (data) {
        const config = data.config as any;
        setIntegrationConfig(config);
        setAdAccountId(config?.adAccountId || '');
        setSelectedCampaigns(config?.selectedCampaigns || []);
        setDateRangePreset(config?.dateRangePreset || 'last_30d');
        if (config?.customDateRange) {
          setCustomDateRange({
            from: new Date(config.customDateRange.from),
            to: new Date(config.customDateRange.to)
          });
        }
        setLastSyncAt(data.last_sync_at);
        
        if (isOAuthConnected && config?.adAccountId) {
          setWizardStep('complete');
        }
      }
    };

    loadConfig();
  }, [currentCompany?.id, isOAuthConnected]);

  const handleConnectOAuth = async () => {
    await connect();
  };

  const handleFetchCampaigns = async (customRange?: { from: string; to: string }) => {
    if (!adAccountId.trim()) {
      toast.error('Please enter your Ad Account ID');
      return;
    }

    setIsFetchingCampaigns(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        toast.error('Please reconnect your Meta account');
        return;
      }

      const { data, error } = await supabase.functions.invoke('fetch-meta-ads', {
        body: {
          action: 'get-campaigns',
          companyId: currentCompany?.id,
          accessToken,
          adAccountId,
          customDateRange: customRange,
        },
      });

      if (error || !data?.campaigns) {
        throw new Error(data?.error || 'Failed to fetch campaigns');
      }

      setCampaigns(data.campaigns);
      if (!customRange) {
        // Only auto-select all when first loading, not when refreshing for custom filter
        setSelectedCampaigns(data.campaigns.map((c: MetaAdsCampaign) => c.id));
      }
      setWizardStep('configure');
      toast.success('Campaigns loaded!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch campaigns');
    } finally {
      setIsFetchingCampaigns(false);
    }
  };

  // Refetch campaigns when custom date range changes for DELIVERED_CUSTOM filter
  const handleRefreshWithCustomRange = async () => {
    if (customDateRange?.from && customDateRange?.to) {
      await handleFetchCampaigns({
        from: format(customDateRange.from, 'yyyy-MM-dd'),
        to: format(customDateRange.to, 'yyyy-MM-dd'),
      });
    }
  };

  const handleSaveConfig = async () => {
    if (selectedCampaigns.length === 0) {
      toast.error('Please select at least one campaign');
      return;
    }

    try {
      const accessToken = await getAccessToken();
      
      const configToSave: MetaAdsConfig = {
        adAccountId,
        selectedCampaigns,
        dateRangePreset,
        ...(dateRangePreset === 'custom' && customDateRange?.from && customDateRange?.to ? {
          customDateRange: {
            from: format(customDateRange.from, 'yyyy-MM-dd'),
            to: format(customDateRange.to, 'yyyy-MM-dd')
          }
        } : {})
      };
      
      const { error } = await supabase.functions.invoke('fetch-meta-ads', {
        body: {
          action: 'save-config',
          companyId: currentCompany?.id,
          accessToken,
          adAccountId,
          config: configToSave,
        },
      });

      if (error) throw error;

      setIntegrationConfig(configToSave);
      setWizardStep('complete');
      toast.success('Configuration saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save configuration');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-meta-ads', {
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
      await supabase.functions.invoke('fetch-meta-ads', {
        body: { action: 'disconnect', companyId: currentCompany?.id },
      });
      await oauthDisconnect();
      setWizardStep('connect');
      setIntegrationConfig(null);
      setAdAccountId('');
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
              Account: {integrationConfig.adAccountId}
            </span>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={async () => {
                // Load campaigns first, then go to configure
                if (campaigns.length === 0) {
                  await handleFetchCampaigns();
                } else {
                  setWizardStep('configure');
                }
              }}>
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
               integrationConfig.dateRangePreset === 'last_30d' ? 'Last 30 days' : 
               integrationConfig.dateRangePreset === 'last_90d' ? 'Last 90 days' :
               integrationConfig.customDateRange ? 
                 `${integrationConfig.customDateRange.from} to ${integrationConfig.customDateRange.to}` : 
                 'Custom'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // OAuth connected, needs Ad Account ID
  if (isOAuthConnected && wizardStep !== 'configure') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="font-medium">Meta Account Connected</span>
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
            Find in Meta Business Suite → Business Settings → Ad Accounts
          </p>
        </div>

        <Button 
          onClick={() => handleFetchCampaigns()}
          disabled={isFetchingCampaigns || !adAccountId.trim()}
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
    const filteredCampaigns = statusFilter === 'all' 
      ? campaigns 
      : statusFilter === 'DELIVERED_30D' || statusFilter === 'DELIVERED_CUSTOM'
        ? campaigns.filter(c => c.hasRecentDelivery)
        : campaigns.filter(c => c.status === statusFilter);
    
    const getStatusBadgeVariant = (status: string) => {
      switch (status) {
        case 'ACTIVE': return 'default';
        case 'PAUSED': return 'secondary';
        default: return 'outline';
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Select Campaigns</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedCampaigns(
                selectedCampaigns.length === filteredCampaigns.length ? [] : filteredCampaigns.map(c => c.id)
              )}
            >
              {selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0 ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm text-muted-foreground">Filter:</Label>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                <SelectItem value="DELIVERED_30D">Delivered (30 days)</SelectItem>
                <SelectItem value="DELIVERED_CUSTOM">Delivered (custom range)</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="DELETED">Off</SelectItem>
              </SelectContent>
            </Select>
            {statusFilter === 'DELIVERED_CUSTOM' && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !customDateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange?.from ? (
                        customDateRange.to ? (
                          <>
                            {format(customDateRange.from, "LLL dd")} -{" "}
                            {format(customDateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(customDateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick dates</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={customDateRange?.from}
                      selected={customDateRange}
                      onSelect={setCustomDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleRefreshWithCustomRange}
                  disabled={isFetchingCampaigns || !customDateRange?.from || !customDateRange?.to}
                >
                  {isFetchingCampaigns ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="border rounded-lg max-h-48 overflow-y-auto">
          {filteredCampaigns.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No campaigns found with selected status
            </div>
          ) : (
            filteredCampaigns.map(campaign => (
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
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{campaign.name}</p>
                    {campaign.hasRecentDelivery && (
                      <Badge variant="default" className="text-xs bg-green-600">
                        Delivered
                      </Badge>
                    )}
                  </div>
                  <Badge variant={getStatusBadgeVariant(campaign.status)} className="text-xs mt-1">
                    {campaign.status === 'DELETED' ? 'Off' : campaign.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <Label>Date Range for Sync</Label>
          <Select value={dateRangePreset} onValueChange={(v: any) => setDateRangePreset(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7d">Last 7 days</SelectItem>
              <SelectItem value="last_30d">Last 30 days</SelectItem>
              <SelectItem value="last_90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          {dateRangePreset === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !customDateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange?.from ? (
                    customDateRange.to ? (
                      <>
                        {format(customDateRange.from, "LLL dd, y")} -{" "}
                        {format(customDateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(customDateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={customDateRange?.from}
                  selected={customDateRange}
                  onSelect={setCustomDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
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
        Connect your Meta account to import campaign data from Facebook and Instagram Ads.
      </p>
      
      <Button onClick={handleConnectOAuth} disabled={isConnecting} className="w-full" variant="outline">
        {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : (
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )}
        {isConnecting ? 'Connecting...' : 'Connect with Meta'}
      </Button>
    </div>
  );
};
