import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useOAuth } from '@/hooks/useOAuth';
import { useCompany } from '@/context/company/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, RefreshCw, Settings, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type Step = 'connect' | 'select-property' | 'configure' | 'connected';

interface Property {
  id: string;
  name: string;
  account: string;
}

interface SyncLog {
  id: string;
  started_at: string;
  status: string;
  records_processed: number | null;
}

const AVAILABLE_METRICS = [
  { id: 'sessions', name: 'Sessions' },
  { id: 'totalUsers', name: 'Total Users' },
  { id: 'newUsers', name: 'New Users' },
  { id: 'screenPageViews', name: 'Page Views' },
  { id: 'bounceRate', name: 'Bounce Rate' },
  { id: 'averageSessionDuration', name: 'Avg Session Duration' },
  { id: 'conversions', name: 'Conversions' },
];

export function GoogleAnalyticsIntegration() {
  const { currentCompany } = useCompany();
  const {
    isConnected,
    isLoading,
    isConnecting,
    connect,
    disconnect,
  } = useOAuth('google_analytics');

  const [step, setStep] = useState<Step>('connect');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showReconfigure, setShowReconfigure] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncLog[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [currentConfig, setCurrentConfig] = useState<{
    propertyId?: string;
    selectedMetrics?: string[];
    dateRangeMonths?: number;
  } | null>(null);

  // Form state
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['sessions', 'totalUsers', 'screenPageViews', 'conversions']);
  const [dateRangeMonths, setDateRangeMonths] = useState('3');

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
        .eq('integration_type', 'google_analytics')
        .eq('is_active', true)
        .maybeSingle();

      if (integration) {
        const config = integration.config as Record<string, unknown> | null;
        setCurrentConfig({
          propertyId: config?.propertyId as string,
          selectedMetrics: config?.selectedMetrics as string[],
          dateRangeMonths: config?.dateRangeMonths as number,
        });
        setLastSyncAt(integration.last_sync_at);
      }

      // Get sync history
      const { data: syncLogs } = await supabase
        .from('integration_sync_log')
        .select('id, started_at, status, records_processed')
        .eq('company_id', currentCompany.id)
        .eq('sync_type', 'google_analytics')
        .order('started_at', { ascending: false })
        .limit(5);

      if (syncLogs) {
        setSyncHistory(syncLogs);
      }
    } catch (error) {
      console.error('Failed to load integration config:', error);
    }
  };

  const handleConnect = async () => {
    await connect();
    // OAuth flow will happen in popup, when successful the isConnected state will update
    // and useEffect will move to 'connected' step
  };

  // When OAuth completes, fetch properties
  useEffect(() => {
    if (isConnected && step === 'connect') {
      fetchProperties().then(() => setStep('select-property'));
    }
  }, [isConnected]);

  const fetchProperties = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('fetch-google-analytics', {
        body: {
          action: 'list_properties',
          companyId: currentCompany.id,
        },
      });

      if (error) throw error;
      if (data?.properties) {
        setProperties(data.properties);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      toast.error('Failed to fetch Google Analytics properties');
    }
  };

  const handlePropertySelect = () => {
    if (!selectedPropertyId) return;
    setStep('configure');
  };

  const handleSaveConfig = async () => {
    if (!currentCompany?.id || !selectedPropertyId) return;

    try {
      // Update integration config
      const { error } = await supabase
        .from('company_integrations')
        .update({
          config: {
            propertyId: selectedPropertyId,
            selectedMetrics,
            dateRangeMonths: parseInt(dateRangeMonths),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('company_id', currentCompany.id)
        .eq('integration_type', 'google_analytics');

      if (error) throw error;

      setCurrentConfig({
        propertyId: selectedPropertyId,
        selectedMetrics,
        dateRangeMonths: parseInt(dateRangeMonths),
      });
      setStep('connected');
      setShowReconfigure(false);
      toast.success('Google Analytics configuration saved');
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Failed to save configuration');
    }
  };

  const handleSync = async () => {
    if (!currentCompany?.id) return;

    setIsSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('fetch-google-analytics', {
        body: {
          companyId: currentCompany.id,
        },
      });

      if (error) throw error;
      toast.success('Google Analytics data synced successfully');
      await loadIntegrationConfig();
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync Google Analytics data');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    const success = await disconnect();
    if (success) {
      setStep('connect');
      setSelectedPropertyId('');
      setSelectedMetrics(['sessions', 'totalUsers', 'screenPageViews', 'conversions']);
      setCurrentConfig(null);
      setSyncHistory([]);
    }
  };

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
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

  if (step === 'connected' && isConnected && !showReconfigure) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-orange-500" />
              <div>
                <CardTitle className="text-lg">Google Analytics</CardTitle>
                <CardDescription>Website analytics and user behavior</CardDescription>
              </div>
            </div>
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Property ID:</span>
              <p className="font-medium">{currentConfig?.propertyId || 'Not configured'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Sync:</span>
              <p className="font-medium">
                {lastSyncAt ? format(new Date(lastSyncAt), 'PPp') : 'Never'}
              </p>
            </div>
          </div>

          {syncHistory.length > 0 && (
            <div className="border rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2">Recent Syncs</h4>
              <div className="space-y-2">
                {syncHistory.slice(0, 3).map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-sm">
                    <span>{format(new Date(log.started_at), 'PP')}</span>
                    <div className="flex items-center gap-2">
                      {log.status === 'completed' ? (
                        <Badge variant="outline" className="text-green-600">
                          {log.records_processed} records
                        </Badge>
                      ) : log.status === 'failed' ? (
                        <Badge variant="destructive">Failed</Badge>
                      ) : (
                        <Badge variant="secondary">Running</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSync} disabled={isSyncing} className="flex-1">
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync Now
            </Button>
            <Button variant="outline" onClick={() => {
              setShowReconfigure(true);
              fetchProperties();
              setStep('select-property');
            }}>
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
            <Button variant="destructive" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-orange-500" />
          <div>
            <CardTitle className="text-lg">Google Analytics</CardTitle>
            <CardDescription>
              {step === 'connect' && 'Connect your Google Analytics account'}
              {step === 'select-property' && 'Select a property to sync'}
              {step === 'configure' && 'Configure sync settings'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'connect' && (
          <>
            <p className="text-sm text-muted-foreground">
              Click the button below to connect your Google Analytics account. You'll be redirected to Google to authorize access.
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
          </>
        )}

        {step === 'select-property' && (
          <>
            <div>
              <Label>Select Property</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name} ({property.account})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setStep(isConnected ? 'connected' : 'connect');
                setShowReconfigure(false);
              }}>
                Back
              </Button>
              <Button onClick={handlePropertySelect} disabled={!selectedPropertyId} className="flex-1">
                Continue
              </Button>
            </div>
          </>
        )}

        {step === 'configure' && (
          <>
            <div className="space-y-4">
              <div>
                <Label>Metrics to Sync</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_METRICS.map((metric) => (
                    <div key={metric.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={metric.id}
                        checked={selectedMetrics.includes(metric.id)}
                        onCheckedChange={() => toggleMetric(metric.id)}
                      />
                      <label htmlFor={metric.id} className="text-sm cursor-pointer">
                        {metric.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Date Range</Label>
                <Select value={dateRangeMonths} onValueChange={setDateRangeMonths}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 1 month</SelectItem>
                    <SelectItem value="3">Last 3 months</SelectItem>
                    <SelectItem value="6">Last 6 months</SelectItem>
                    <SelectItem value="12">Last 12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('select-property')}>
                Back
              </Button>
              <Button onClick={handleSaveConfig} disabled={selectedMetrics.length === 0} className="flex-1">
                Save & Connect
              </Button>
            </div>
          </>
        )}

        {showReconfigure && (
          <Button variant="ghost" onClick={() => {
            setShowReconfigure(false);
            setStep('connected');
          }} className="w-full">
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
