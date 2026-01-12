import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, RefreshCw, Unlink, Settings, Search } from 'lucide-react';
import { useOAuth } from '@/hooks/useOAuth';
import { useCompany } from '@/context/company/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

type Step = 'connect' | 'select-site' | 'connected';

interface Site {
  siteUrl: string;
  permissionLevel: string;
}

interface SyncLog {
  id: string;
  started_at: string;
  status: string;
  records_processed: number | null;
}

export function GoogleSearchConsoleIntegration() {
  const { currentCompany } = useCompany();
  const {
    isConnected,
    isLoading,
    isConnecting,
    connect,
    disconnect,
  } = useOAuth('google_search_console');

  const [step, setStep] = useState<Step>('connect');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncLog[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [config, setConfig] = useState<{
    siteUrl?: string;
    dateRangePreset?: string;
  } | null>(null);

  // Form state
  const [selectedSite, setSelectedSite] = useState('');
  const [dateRange, setDateRange] = useState('last_30_days');

  // Load integration config when connected
  useEffect(() => {
    if (isConnected && currentCompany?.id) {
      loadIntegrationConfig();
      setStep('connected');
    } else {
      setStep('connect');
    }
  }, [isConnected, currentCompany?.id]);

  const loadIntegrationConfig = async () => {
    if (!currentCompany?.id) return;

    try {
      // Get integration config
      const { data: integration } = await supabase
        .from('company_integrations')
        .select('config, last_sync_at')
        .eq('company_id', currentCompany.id)
        .eq('integration_type', 'google_search_console')
        .eq('is_active', true)
        .maybeSingle();

      if (integration) {
        const integrationConfig = integration.config as Record<string, unknown> | null;
        setConfig({
          siteUrl: integrationConfig?.siteUrl as string,
          dateRangePreset: integrationConfig?.dateRangePreset as string,
        });
        setLastSyncAt(integration.last_sync_at);
      }

      // Get sync history
      const { data: syncLogs } = await supabase
        .from('integration_sync_log')
        .select('id, started_at, status, records_processed')
        .eq('company_id', currentCompany.id)
        .eq('sync_type', 'google_search_console')
        .order('started_at', { ascending: false })
        .limit(5);

      if (syncLogs) {
        setSyncHistory(syncLogs);
      }
    } catch (error) {
      console.error('Failed to load integration config:', error);
    }
  };

  const fetchSites = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('fetch-google-search-console', {
        body: {
          action: 'list_sites',
          companyId: currentCompany.id,
        },
      });

      if (error) throw error;
      if (data?.sites) {
        setSites(data.sites);
      }
    } catch (error) {
      console.error('Failed to fetch sites:', error);
      toast.error('Failed to fetch Search Console sites');
    }
  };

  const handleConnect = async () => {
    await connect();
    // OAuth flow will happen in popup, when successful the isConnected state will update
  };

  // When OAuth completes, fetch sites
  useEffect(() => {
    if (isConnected && step === 'connect') {
      fetchSites().then(() => setStep('select-site'));
    }
  }, [isConnected]);

  const handleSaveConfig = async () => {
    if (!selectedSite || !currentCompany?.id) return;

    setIsSubmitting(true);
    try {
      // Update integration config
      const { error } = await supabase
        .from('company_integrations')
        .update({
          config: {
            siteUrl: selectedSite,
            dateRangePreset: dateRange,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('company_id', currentCompany.id)
        .eq('integration_type', 'google_search_console');

      if (error) throw error;

      setConfig({
        siteUrl: selectedSite,
        dateRangePreset: dateRange,
      });
      setStep('connected');
      toast.success('Google Search Console configuration saved');
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSync = async () => {
    if (!currentCompany?.id) return;

    setIsSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('fetch-google-search-console', {
        body: {
          companyId: currentCompany.id,
        },
      });

      if (error) throw error;
      toast.success('Google Search Console data synced successfully');
      await loadIntegrationConfig();
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync Search Console data');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsSubmitting(true);
    const success = await disconnect();
    if (success) {
      setStep('connect');
      setSelectedSite('');
      setConfig(null);
      setSyncHistory([]);
    }
    setIsSubmitting(false);
  };

  const handleReconfigure = async () => {
    await fetchSites();
    setStep('select-site');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Google Search Console</CardTitle>
              <CardDescription>
                Import organic search performance data
              </CardDescription>
            </div>
          </div>
          {isConnected && step === 'connected' && (
            <Badge variant="default" className="bg-green-500">
              <Check className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {step === 'connect' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Google Search Console to import organic search impressions, clicks, CTR, and average position.
            </p>
            
            <Button onClick={handleConnect} className="w-full">
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Connect with Google
            </Button>
          </div>
        )}

        {step === 'select-site' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the property you want to import data from.
            </p>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Select Property</Label>
                <Select value={selectedSite} onValueChange={setSelectedSite}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.siteUrl} value={site.siteUrl}>
                        {site.siteUrl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_7_days">Last 7 days</SelectItem>
                    <SelectItem value="last_30_days">Last 30 days</SelectItem>
                    <SelectItem value="last_90_days">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(isConnected ? 'connected' : 'connect')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSaveConfig}
                disabled={isSubmitting || !selectedSite}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save & Connect'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'connected' && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property:</span>
                  <span className="font-medium">{config?.siteUrl || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date Range:</span>
                  <span className="font-medium">
                    {config?.dateRangePreset?.replace(/_/g, ' ') || 'Last 30 days'}
                  </span>
                </div>
                {lastSyncAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Sync:</span>
                    <span className="font-medium">
                      {format(new Date(lastSyncAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {syncHistory.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Recent Syncs</Label>
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {syncHistory.slice(0, 3).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded border px-2 py-1 text-xs"
                    >
                      <span>
                        {format(new Date(entry.started_at), 'MMM d, h:mm a')}
                      </span>
                      <Badge
                        variant={entry.status === 'completed' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {entry.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSync}
                disabled={isSyncing}
                className="flex-1"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Now
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleReconfigure}
                size="icon"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={isSubmitting}
                size="icon"
              >
                <Unlink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
