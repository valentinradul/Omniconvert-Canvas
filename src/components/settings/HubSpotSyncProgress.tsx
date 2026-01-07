import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';

interface SyncProgressProps {
  status: 'idle' | 'running' | 'completed' | 'failed';
  message?: string;
  progress?: number;
  details?: {
    dealsProcessed?: number;
    recordsCreated?: number;
    recordsUpdated?: number;
    recordsSkipped?: number;
  };
}

export const HubSpotSyncProgress: React.FC<SyncProgressProps> = ({
  status,
  message,
  progress = 0,
  details
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'running':
        return 'Syncing...';
      case 'completed':
        return 'Sync completed';
      case 'failed':
        return 'Sync failed';
      default:
        return 'Ready to sync';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {status === 'running' && (
        <Progress value={progress} className="h-2" />
      )}

      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}

      {details && status === 'completed' && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {details.dealsProcessed !== undefined && (
            <div className="flex justify-between p-2 bg-muted rounded">
              <span>Deals processed:</span>
              <span className="font-medium">{details.dealsProcessed}</span>
            </div>
          )}
          {details.recordsCreated !== undefined && (
            <div className="flex justify-between p-2 bg-muted rounded">
              <span>Records created:</span>
              <span className="font-medium text-green-600">{details.recordsCreated}</span>
            </div>
          )}
          {details.recordsUpdated !== undefined && (
            <div className="flex justify-between p-2 bg-muted rounded">
              <span>Records updated:</span>
              <span className="font-medium text-blue-600">{details.recordsUpdated}</span>
            </div>
          )}
          {details.recordsSkipped !== undefined && (
            <div className="flex justify-between p-2 bg-muted rounded">
              <span>Records skipped:</span>
              <span className="font-medium text-muted-foreground">{details.recordsSkipped}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HubSpotSyncProgress;
