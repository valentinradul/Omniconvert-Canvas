
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useViewPreference } from '@/hooks/useViewPreference';

interface ViewPreferenceToggleProps {
  className?: string;
}

const ViewPreferenceToggle: React.FC<ViewPreferenceToggleProps> = ({ className }) => {
  const { viewAllDepartments, toggleViewPreference } = useViewPreference();

  return (
    <div className={`flex items-center space-x-2 ${className || ''}`}>
      <Switch
        id="view-preference"
        checked={viewAllDepartments}
        onCheckedChange={toggleViewPreference}
      />
      <Label htmlFor="view-preference" className="text-sm">
        {viewAllDepartments ? 'View all departments' : 'View my departments only'}
      </Label>
    </div>
  );
};

export default ViewPreferenceToggle;
