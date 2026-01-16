import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { INTEGRATION_LABELS, IntegrationType, ReportingMetric } from '@/types/reporting';
import { Link2, Unlink, AlertCircle, CheckCircle } from 'lucide-react';
import { useOAuth } from '@/hooks/useOAuth';

interface IntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: ReportingMetric | null;
  onConnect: (metricId: string, integrationType: string | null, integrationField?: string | null) => void;
  isLoading?: boolean;
}

const INTEGRATION_ICONS: Record<IntegrationType, string> = {
  google_analytics: '📊',
  google_search_console: '🔍',
  hubspot: '🧲',
  google_ads: '📢',
  linkedin_ads: '💼',
  meta_ads: '📘',
  manual: '✏️',
};

// Google Analytics available fields for mapping
const GA_FIELDS = [
  { id: 'totalUsers', name: 'Total Users', description: 'Total unique users' },
  { id: 'sessions', name: 'Sessions', description: 'Total sessions' },
  { id: 'pageviews', name: 'Page Views', description: 'Total page views' },
  { id: 'newUsers', name: 'New Users', description: 'New unique users' },
  { id: 'bounceRate', name: 'Bounce Rate', description: 'Percentage of single-page sessions' },
  { id: 'avgSessionDuration', name: 'Avg Session Duration', description: 'Average session duration in seconds' },
  { id: 'transactions', name: 'Transactions', description: 'E-commerce transactions' },
  { id: 'purchaseRevenue', name: 'Purchase Revenue', description: 'E-commerce revenue' },
  { id: 'conversions', name: 'Conversions', description: 'Total conversions' },
  { id: 'eventCount', name: 'Event Count', description: 'Total event triggers' },
];

// Google Search Console available fields for mapping
const GSC_FIELDS = [
  { id: 'clicks', name: 'Total Clicks', description: 'Total clicks from search results' },
  { id: 'impressions', name: 'Total Impressions', description: 'Total impressions in search results' },
  { id: 'ctr', name: 'CTR', description: 'Click-through rate' },
  { id: 'position', name: 'Average Position', description: 'Average position in search results' },
  { id: 'branded_clicks', name: 'Branded Clicks', description: 'Clicks for branded keywords' },
  { id: 'branded_impressions', name: 'Branded Impressions', description: 'Impressions for branded keywords' },
  { id: 'non_branded_clicks', name: 'Non-Branded Clicks', description: 'Clicks for non-branded keywords' },
  { id: 'non_branded_impressions', name: 'Non-Branded Impressions', description: 'Impressions for non-branded keywords' },
];

// Integrations that are fully implemented
const IMPLEMENTED_INTEGRATIONS: IntegrationType[] = ['manual', 'google_analytics', 'google_search_console'];

export const IntegrationDialog: React.FC<IntegrationDialogProps> = ({
  open,
  onOpenChange,
  metric,
  onConnect,
  isLoading,
}) => {
  const [selectedIntegration, setSelectedIntegration] = useState<string>(
    metric?.integration_type || 'manual'
  );
  const [selectedField, setSelectedField] = useState<string>(
    metric?.integration_field || ''
  );

  const { isConnected: isGAConnected } = useOAuth('google_analytics');
  const { isConnected: isGSCConnected } = useOAuth('google_search_console');

  React.useEffect(() => {
    if (metric) {
      setSelectedIntegration(metric.integration_type || 'manual');
      setSelectedField(metric.integration_field || '');
    }
  }, [metric]);

  const handleConnect = () => {
    if (metric) {
      const fieldValue = (selectedIntegration === 'google_analytics' || selectedIntegration === 'google_search_console') ? selectedField : null;
      onConnect(metric.id, selectedIntegration === 'manual' ? null : selectedIntegration, fieldValue);
    }
  };

  const handleDisconnect = () => {
    if (metric) {
      onConnect(metric.id, null, null);
    }
  };

  if (!metric) return null;

  const isConnected = metric.integration_type && metric.integration_type !== 'manual';
  const isImplemented = IMPLEMENTED_INTEGRATIONS.includes(selectedIntegration as IntegrationType);
  const needsGAConnection = selectedIntegration === 'google_analytics' && !isGAConnected;
  const needsGSCConnection = selectedIntegration === 'google_search_console' && !isGSCConnected;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Integration</DialogTitle>
          <DialogDescription>
            Connect "{metric.name}" to an external data source to automatically populate values.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {isConnected && (
            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Connected to {INTEGRATION_LABELS[metric.integration_type as IntegrationType]}
                    {metric.integration_field && metric.integration_type === 'google_analytics' && ` (${GA_FIELDS.find(f => f.id === metric.integration_field)?.name || metric.integration_field})`}
                    {metric.integration_field && metric.integration_type === 'google_search_console' && ` (${GSC_FIELDS.find(f => f.id === metric.integration_field)?.name || metric.integration_field})`}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-red-600 hover:text-red-700"
                >
                  <Unlink className="h-4 w-4 mr-1" />
                  Disconnect
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Select Integration</Label>
            <Select value={selectedIntegration} onValueChange={(v) => {
              setSelectedIntegration(v);
              setSelectedField('');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select an integration" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INTEGRATION_LABELS).map(([key, label]) => {
                  const implemented = IMPLEMENTED_INTEGRATIONS.includes(key as IntegrationType);
                  const isGAOption = key === 'google_analytics';
                  const isGSCOption = key === 'google_search_console';
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{INTEGRATION_ICONS[key as IntegrationType]}</span>
                        <span>{label}</span>
                        {isGAOption && isGAConnected && (
                          <Badge variant="default" className="ml-2 text-xs bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        )}
                        {isGAOption && !isGAConnected && (
                          <Badge variant="outline" className="ml-2 text-xs text-amber-600 border-amber-300">
                            Not Connected
                          </Badge>
                        )}
                        {isGSCOption && isGSCConnected && (
                          <Badge variant="default" className="ml-2 text-xs bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        )}
                        {isGSCOption && !isGSCConnected && (
                          <Badge variant="outline" className="ml-2 text-xs text-amber-600 border-amber-300">
                            Not Connected
                          </Badge>
                        )}
                        {!implemented && !isGAOption && !isGSCOption && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Google Analytics field selection */}
          {selectedIntegration === 'google_analytics' && (
            <div className="space-y-2">
              <Label>Select GA Metric to Sync</Label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose which GA metric to pull" />
                </SelectTrigger>
                <SelectContent>
                  {GA_FIELDS.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      <div className="flex flex-col">
                        <span>{field.name}</span>
                        <span className="text-xs text-muted-foreground">{field.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Google Search Console field selection */}
          {selectedIntegration === 'google_search_console' && (
            <div className="space-y-2">
              <Label>Select GSC Metric to Sync</Label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose which GSC metric to pull" />
                </SelectTrigger>
                <SelectContent>
                  {GSC_FIELDS.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      <div className="flex flex-col">
                        <span>{field.name}</span>
                        <span className="text-xs text-muted-foreground">{field.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Warning for GA not connected */}
          {needsGAConnection && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Google Analytics not connected</p>
                  <p className="text-xs mt-1">
                    Go to Settings → Integrations to connect your Google Analytics account first.
                    Once connected, syncing will work automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning for GSC not connected */}
          {needsGSCConnection && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Google Search Console not connected</p>
                  <p className="text-xs mt-1">
                    Go to Settings → Integrations to connect your Google Search Console account first.
                    Once connected, syncing will work automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ready to sync message for GA */}
          {selectedIntegration === 'google_analytics' && isGAConnected && selectedField && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Ready to sync!</strong> This metric will automatically pull "{GA_FIELDS.find(f => f.id === selectedField)?.name}" 
                data from your connected Google Analytics property when you run a sync.
              </p>
            </div>
          )}

          {/* Ready to sync message for GSC */}
          {selectedIntegration === 'google_search_console' && isGSCConnected && selectedField && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Ready to sync!</strong> This metric will automatically pull "{GSC_FIELDS.find(f => f.id === selectedField)?.name}" 
                data from your connected Google Search Console property when you run a sync.
              </p>
            </div>
          )}

          {/* Coming soon message for unimplemented integrations */}
          {!isImplemented && selectedIntegration !== 'manual' && (
            <div className="p-3 bg-muted border rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Automatic data sync with {INTEGRATION_LABELS[selectedIntegration as IntegrationType]} is coming soon. 
                For now, this marks the field's intended data source. You can still manually enter values.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConnect} 
            disabled={isLoading || ((selectedIntegration === 'google_analytics' || selectedIntegration === 'google_search_console') && !selectedField)}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
