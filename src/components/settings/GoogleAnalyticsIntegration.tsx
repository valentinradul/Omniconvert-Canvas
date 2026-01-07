import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useGoogleAnalyticsIntegration } from '@/hooks/useGoogleAnalyticsIntegration';
import { Loader2, CheckCircle, XCircle, RefreshCw, Settings, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

type Step = 'connect' | 'select-property' | 'configure' | 'connected';

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
  const {
    isConnected,
    isLoading,
    isSyncing,
    lastSyncAt,
    syncHistory,
    properties,
    currentConfig,
    testConnection,
    fetchProperties,
    saveConfiguration,
    syncData,
    disconnect,
  } = useGoogleAnalyticsIntegration();

  const [step, setStep] = useState<Step>(isConnected ? 'connected' : 'connect');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showReconfigure, setShowReconfigure] = useState(false);

  // Form state
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['sessions', 'totalUsers', 'screenPageViews', 'conversions']);
  const [dateRangeMonths, setDateRangeMonths] = useState('3');

  // Update step when connection status changes
  useState(() => {
    if (isConnected && step === 'connect') {
      setStep('connected');
    }
  });

  const handleConnect = async () => {
    if (!accessToken || !clientId || !clientSecret) return;

    setIsConnecting(true);
    try {
      const config = {
        propertyId: '',
        accessToken,
        refreshToken,
        clientId,
        clientSecret,
        selectedMetrics: [],
        dateRangeMonths: 3,
      };

      const success = await testConnection(config);
      if (success) {
        await fetchProperties(config);
        setStep('select-property');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePropertySelect = () => {
    if (!selectedPropertyId) return;
    setStep('configure');
  };

  const handleSaveConfig = async () => {
    setIsConnecting(true);
    try {
      const success = await saveConfiguration({
        propertyId: selectedPropertyId,
        accessToken,
        refreshToken,
        clientId,
        clientSecret,
        selectedMetrics,
        dateRangeMonths: parseInt(dateRangeMonths),
      });

      if (success) {
        setStep('connected');
        setShowReconfigure(false);
        // Clear sensitive data from form
        setAccessToken('');
        setRefreshToken('');
        setClientId('');
        setClientSecret('');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const success = await disconnect();
    if (success) {
      setStep('connect');
      setSelectedPropertyId('');
      setSelectedMetrics(['sessions', 'totalUsers', 'screenPageViews', 'conversions']);
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
              <p className="font-medium">{currentConfig?.propertyId}</p>
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
            <Button onClick={syncData} disabled={isSyncing} className="flex-1">
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync Now
            </Button>
            <Button variant="outline" onClick={() => setShowReconfigure(true)}>
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
            <div className="space-y-3">
              <div>
                <Label htmlFor="ga-client-id">OAuth Client ID</Label>
                <Input
                  id="ga-client-id"
                  type="password"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter OAuth Client ID"
                />
              </div>
              <div>
                <Label htmlFor="ga-client-secret">OAuth Client Secret</Label>
                <Input
                  id="ga-client-secret"
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter OAuth Client Secret"
                />
              </div>
              <div>
                <Label htmlFor="ga-access-token">Access Token</Label>
                <Input
                  id="ga-access-token"
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Enter Access Token"
                />
              </div>
              <div>
                <Label htmlFor="ga-refresh-token">Refresh Token (optional)</Label>
                <Input
                  id="ga-refresh-token"
                  type="password"
                  value={refreshToken}
                  onChange={(e) => setRefreshToken(e.target.value)}
                  placeholder="Enter Refresh Token"
                />
              </div>
            </div>
            <Button
              onClick={handleConnect}
              disabled={isConnecting || !accessToken || !clientId || !clientSecret}
              className="w-full"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Connect to Google Analytics
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
              <Button variant="outline" onClick={() => setStep('connect')}>
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
              <Button onClick={handleSaveConfig} disabled={isConnecting || selectedMetrics.length === 0} className="flex-1">
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save & Connect
              </Button>
            </div>
          </>
        )}

        {showReconfigure && (
          <Button variant="ghost" onClick={() => setShowReconfigure(false)} className="w-full">
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
