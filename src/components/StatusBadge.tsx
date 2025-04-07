
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
        return 'bg-gray-200 text-gray-800';
      case 'Running':
        return 'bg-blue-500 text-white';
      case 'Paused':
        return 'bg-amber-500 text-white';
      case 'Winning':
        return 'bg-green-500 text-white';
      case 'Losing':
        return 'bg-red-500 text-white';
      case 'Inconclusive':
        return 'bg-purple-500 text-white';
      case 'Completed':
        return 'bg-gray-500 text-white';
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
