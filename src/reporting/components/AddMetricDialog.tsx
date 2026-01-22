import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INTEGRATION_LABELS, IntegrationType } from '@/types/reporting';

interface AddMetricDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    source: string;
    integration_type: string | null;
  }) => void;
  isLoading?: boolean;
}

export const AddMetricDialog: React.FC<AddMetricDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}) => {
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [integrationType, setIntegrationType] = useState<string>('manual');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      source: source || INTEGRATION_LABELS[integrationType as IntegrationType] || 'Manual',
      integration_type: integrationType === 'manual' ? null : integrationType,
    });
    setName('');
    setSource('');
    setIntegrationType('manual');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Metric</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Metric Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Total Traffic, Conversion Rate"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="integration">Data Source</Label>
              <Select value={integrationType} onValueChange={setIntegrationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INTEGRATION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Show "Coming Soon" only for unimplemented integrations */}
            {integrationType !== 'manual' && 
             !['google_analytics', 'google_search_console', 'hubspot'].includes(integrationType) && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Integration with {INTEGRATION_LABELS[integrationType as IntegrationType]} will be available soon. 
                  For now, you can manually enter data.
                </p>
              </div>
            )}
            {/* Show ready message for implemented integrations */}
            {['google_analytics', 'google_search_console', 'hubspot'].includes(integrationType) && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  After adding this metric, click the link icon to configure which {INTEGRATION_LABELS[integrationType as IntegrationType]} field to sync.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="source">Custom Source Label (optional)</Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Override the default source label"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? 'Adding...' : 'Add Metric'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
