
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Info } from 'lucide-react';
import { useCompany } from '@/context/company/CompanyContext';
import { useCompanyContentSettings } from '@/context/hooks/useCompanyContentSettings';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ContentVisibilitySettings: React.FC = () => {
  const { currentCompany } = useCompany();
  const { settings, isLoading, updateSettings } = useCompanyContentSettings(currentCompany?.id || null);

  const handleToggle = (checked: boolean) => {
    updateSettings(checked);
  };

  if (!currentCompany) {
    return null;
  }

  const isRestricted = settings?.restrict_content_to_departments || false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            {isRestricted ? (
              <EyeOff className="h-5 w-5 text-blue-600" />
            ) : (
              <Eye className="h-5 w-5 text-blue-600" />
            )}
          </div>
          <div>
            <CardTitle>Content Visibility Settings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Control what content members can see across departments
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This setting controls whether team members can see ideas, hypotheses, and experiments 
            from all departments or only from departments they have access to.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="restrict-content" className="text-base font-medium">
              Restrict content to departments
            </Label>
            <p className="text-sm text-muted-foreground">
              When enabled, members only see content from their assigned departments
            </p>
          </div>
          <Switch
            id="restrict-content"
            checked={isRestricted}
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium text-green-700">When Disabled (Default)</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Members see all company content</li>
              <li>• Cross-department collaboration</li>
              <li>• Maximum visibility and sharing</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-orange-700">When Enabled</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Members see only their departments</li>
              <li>• Departmental content isolation</li>
              <li>• Reduced cross-department visibility</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentVisibilitySettings;
