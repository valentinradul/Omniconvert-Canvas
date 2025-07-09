
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCompanyContentSettings } from '@/context/hooks/useCompanyContentSettings';
import { useCompany } from '@/context/company/CompanyContext';

const ContentVisibilitySettings: React.FC = () => {
  const { currentCompany, userCompanyRole } = useCompany();
  const { settings, loading, updateSettings } = useCompanyContentSettings(currentCompany);

  // Only show to admins and owners
  if (userCompanyRole !== 'owner' && userCompanyRole !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Visibility Settings</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Visibility Settings</CardTitle>
        <CardDescription>
          Control whether team members can see content from all departments or only their assigned departments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="restrict-content">Restrict content to assigned departments</Label>
            <p className="text-sm text-muted-foreground">
              When enabled, members will only see ideas and experiments from departments they have access to.
              When disabled, all members can see content from all departments.
            </p>
          </div>
          <Switch
            id="restrict-content"
            checked={settings?.restrict_content_to_departments || false}
            onCheckedChange={updateSettings}
          />
        </div>
        
        <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/50 rounded-md">
          <strong>Note:</strong> This setting affects how ideas and experiments are displayed to team members.
          Owners and admins always have access to all content regardless of this setting.
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentVisibilitySettings;
