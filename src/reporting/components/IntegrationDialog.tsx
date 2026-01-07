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
import { Link2, Unlink } from 'lucide-react';

interface IntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: ReportingMetric | null;
  onConnect: (metricId: string, integrationType: string | null) => void;
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

  React.useEffect(() => {
    if (metric) {
      setSelectedIntegration(metric.integration_type || 'manual');
    }
  }, [metric]);

  const handleConnect = () => {
    if (metric) {
      onConnect(metric.id, selectedIntegration === 'manual' ? null : selectedIntegration);
    }
  };

  const handleDisconnect = () => {
    if (metric) {
      onConnect(metric.id, null);
    }
  };

  if (!metric) return null;

  const isConnected = metric.integration_type && metric.integration_type !== 'manual';

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
            <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
              <SelectTrigger>
                <SelectValue placeholder="Select an integration" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INTEGRATION_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{INTEGRATION_ICONS[key as IntegrationType]}</span>
                      <span>{label}</span>
                      {key !== 'manual' && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedIntegration !== 'manual' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
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
          <Button onClick={handleConnect} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
