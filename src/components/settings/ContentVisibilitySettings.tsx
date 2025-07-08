
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCompanyContentSettings } from '@/context/hooks/useCompanyContentSettings';
import { useCompany } from '@/context/company/CompanyContext';
import { Skeleton } from '@/components/ui/skeleton';

const ContentVisibilitySettings: React.FC = () => {
  const { currentCompany } = useCompany();
  const { settings, loading, updateSettings, restrictToDepartments } = useCompanyContentSettings(currentCompany);

  const handleToggle = (checked: boolean) => {
    updateSettings(checked);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Visibility Settings</CardTitle>
          <CardDescription>Control what content members can see</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Visibility Settings</CardTitle>
        <CardDescription>
          Control whether members can see all ideas and experiments or only those from their assigned departments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="restrict-content"
            checked={restrictToDepartments}
            onCheckedChange={handleToggle}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="restrict-content" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Restrict content to departments
            </Label>
            <p className="text-xs text-muted-foreground">
              {restrictToDepartments 
                ? "Members can only see ideas and experiments from departments they have access to"
                : "Members can see all ideas and experiments across all departments"
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentVisibilitySettings;
