import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, RefreshCw, Unlink, Settings, Search } from 'lucide-react';
import { useGoogleSearchConsoleIntegration } from '@/hooks/useGoogleSearchConsoleIntegration';
import { format } from 'date-fns';

type Step = 'connect' | 'select-site' | 'connected';

export function GoogleSearchConsoleIntegration() {
  const {
    isConnected,
    isLoading,
    sites,
    lastSyncAt,
    syncHistory,
    config,
    testConnection,
    saveConfig,
    syncData,
    disconnect,
  } = useGoogleSearchConsoleIntegration();

  const [step, setStep] = useState<Step>(isConnected ? 'connected' : 'connect');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form state
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [dateRange, setDateRange] = useState('last_30_days');

  const handleConnect = async () => {
    if (!accessToken || !clientId || !clientSecret) return;

    setIsSubmitting(true);
    const result = await testConnection({
      accessToken,
      refreshToken,
      clientId,
      clientSecret,
    });

    if (result) {
      setStep('select-site');
    }
    setIsSubmitting(false);
  };

  const handleSaveConfig = async () => {
    if (!selectedSite) return;

    setIsSubmitting(true);
    const success = await saveConfig(selectedSite, dateRange);
    if (success) {
      setStep('connected');
    }
    setIsSubmitting(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await syncData();
    setIsSyncing(false);
  };

  const handleDisconnect = async () => {
    setIsSubmitting(true);
    const success = await disconnect();
    if (success) {
      setStep('connect');
      setAccessToken('');
      setRefreshToken('');
      setClientId('');
      setClientSecret('');
      setSelectedSite('');
    }
    setIsSubmitting(false);
  };

  const handleReconfigure = () => {
    setStep('connect');
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

  // Check if already connected on mount
  if (isConnected && step === 'connect') {
    setStep('connected');
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
          {isConnected && (
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
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="gsc-client-id">OAuth Client ID</Label>
                <Input
                  id="gsc-client-id"
                  type="text"
                  placeholder="Your OAuth 2.0 Client ID"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gsc-client-secret">OAuth Client Secret</Label>
                <Input
                  id="gsc-client-secret"
                  type="password"
                  placeholder="Your OAuth 2.0 Client Secret"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gsc-access-token">Access Token</Label>
                <Input
                  id="gsc-access-token"
                  type="password"
                  placeholder="Your OAuth Access Token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gsc-refresh-token">Refresh Token (optional)</Label>
                <Input
                  id="gsc-refresh-token"
                  type="password"
                  placeholder="Your OAuth Refresh Token"
                  value={refreshToken}
                  onChange={(e) => setRefreshToken(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isSubmitting || !accessToken || !clientId || !clientSecret}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
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
                onClick={() => setStep('connect')}
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
