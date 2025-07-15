
import React, { useEffect, useState } from 'react';
import { useCompany } from '@/context/company/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Users, FolderTree, Settings } from 'lucide-react';

interface ContentSettings {
  restrictContentToDepartments: boolean;
}

const ContentManagementSettings: React.FC = () => {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const [settings, setSettings] = useState<ContentSettings>({
    restrictContentToDepartments: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchContentSettings();
    }
  }, [currentCompany?.id]);

  const fetchContentSettings = async () => {
    if (!currentCompany?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('company_content_settings')
        .select('*')
        .eq('company_id', currentCompany.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          restrictContentToDepartments: data.restrict_content_to_departments
        });
      } else {
        // Create default settings if none exist
        const { error: insertError } = await supabase
          .from('company_content_settings')
          .insert({
            company_id: currentCompany.id,
            restrict_content_to_departments: false
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error fetching content settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = async (field: keyof ContentSettings, value: boolean) => {
    if (!currentCompany?.id) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('company_content_settings')
        .upsert({
          company_id: currentCompany.id,
          restrict_content_to_departments: field === 'restrictContentToDepartments' ? value : settings.restrictContentToDepartments
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, [field]: value }));
      
      toast({
        title: 'Success',
        description: 'Content settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating content settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update content settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading content settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Department-Based Content Access
            </CardTitle>
            <CardDescription>
              Control whether content (ideas, hypotheses, experiments) should be restricted to specific departments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="restrict-departments" className="text-base font-medium">
                  Restrict Content to Departments
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, users can only see content from departments they have access to
                </p>
              </div>
              <Switch
                id="restrict-departments"
                checked={settings.restrictContentToDepartments}
                onCheckedChange={(value) => handleSettingChange('restrictContentToDepartments', value)}
                disabled={isSaving}
              />
            </div>

            {settings.restrictContentToDepartments && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-900">
                      Department Restriction Active
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Company owners and admins can see all content</li>
                      <li>• Regular members can only see content from their assigned departments</li>
                      <li>• Content without department assignment is visible to all members</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {!settings.restrictContentToDepartments && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">
                      Open Access Mode
                    </p>
                    <p className="text-sm text-gray-700">
                      All company members can see all content regardless of department assignments.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Settings</CardTitle>
            <CardDescription>
              More content management options will be available here in the future
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Additional content management features coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContentManagementSettings;
