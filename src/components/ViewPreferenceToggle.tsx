
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useViewPreference } from '@/hooks/useViewPreference';
import { useCompany } from '@/context/company/CompanyContext';

interface ViewPreferenceToggleProps {
  className?: string;
}

const ViewPreferenceToggle: React.FC<ViewPreferenceToggleProps> = ({ className }) => {
  const { viewAllDepartments, toggleViewPreference, canViewAllDepartments } = useViewPreference();
  const { userCompanyRole } = useCompany();

  // Don't show the toggle if user doesn't have permission
  if (!canViewAllDepartments) {
    return (
      <div className={`flex items-center space-x-2 ${className || ''}`}>
        <div className="text-sm text-muted-foreground">
          View limited to your departments
          {userCompanyRole === 'member' && (
            <div className="text-xs text-muted-foreground mt-1">
              Contact your admin for full access
            </div>
          )}
        </div>
      </div>
    );
  }

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
