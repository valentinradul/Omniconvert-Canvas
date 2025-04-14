
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ExperimentStatus } from '@/types';

interface StatusBadgeProps {
  status: ExperimentStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  // Map status to display text
  const getDisplayText = () => {
    switch (status) {
      case 'Winning':
        return 'Winner';
      case 'Losing':
        return 'Loser';
      default:
        return status;
    }
  };
  
  const getClassName = () => {
    switch (status) {
      case 'Planned':
        return 'status-badge-planned';
      case 'In Progress':
        return 'status-badge-in-progress';
      case 'Blocked':
        return 'status-badge-blocked';
      case 'Winning':
        return 'status-badge-winning';
      case 'Losing':
        return 'status-badge-losing';
      case 'Inconclusive':
        return 'status-badge-inconclusive';
      default:
        return '';
    }
  };

  return (
    <Badge className={getClassName()}>
      {getDisplayText()}
    </Badge>
  );
};

export default StatusBadge;
