
import React from 'react';
import { Button } from '@/components/ui/button';
import { Building, Users } from 'lucide-react';

interface ViewPreferenceToggleProps {
  viewPreference: 'all' | 'assigned';
  onToggle: (preference: 'all' | 'assigned') => void;
}

const ViewPreferenceToggle: React.FC<ViewPreferenceToggleProps> = ({
  viewPreference,
  onToggle,
}) => {
  return (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
      <Button
        variant={viewPreference === 'all' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onToggle('all')}
        className="flex items-center gap-1.5"
      >
        <Building className="h-4 w-4" />
        All Departments
      </Button>
      <Button
        variant={viewPreference === 'assigned' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onToggle('assigned')}
        className="flex items-center gap-1.5"
      >
        <Users className="h-4 w-4" />
        My Departments
      </Button>
    </div>
  );
};

export default ViewPreferenceToggle;
