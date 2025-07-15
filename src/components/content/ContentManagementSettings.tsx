
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/context/company/CompanyContext';
import { Loader2, Shield, Info } from 'lucide-react';

interface ContentSettings {
  id: string;
  company_id: string;
  restrict_content_to_departments: boolean;
}

const ContentManagementSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['content-settings', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return null;
      
      const { data, error } = await supabase
        .from('company_content_settings')
        .select('*')
        .eq('company_id', currentCompany.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No settings found, create default
        const { data: newSettings, error: createError } = await supabase
          .from('company_content_settings')
          .insert({
            company_id: currentCompany.id,
            restrict_content_to_departments: false
          })
          .select()
          .single();

        if (createError) throw createError;
        return newSettings;
      }

      if (error) throw error;
      return data;
    },
    enabled: !!currentCompany?.id,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (restrictToDepartments: boolean) => {
      if (!currentCompany?.id || !settings?.id) return;

      const { error } = await supabase
        .from('company_content_settings')
        .update({ restrict_content_to_departments: restrictToDepartments })
        .eq('id', settings.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-settings'] });
      toast({
        title: "Settings updated",
        description: "Content access settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleRestriction = async (enabled: boolean) => {
    setIsUpdating(true);
    try {
      await updateSettingsMutation.mutateAsync(enabled);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12">



        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Department-Based Content Access
          </CardTitle>
          <CardDescription>
            Control whether growth ideas and experiments should be restricted to specific departments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Restrict content to departments</h4>
              <p className="text-sm text-gray-600">
                When enabled, users will only see growth ideas and experiments from their assigned departments
              </p>
            </div>
            <Switch
              checked={settings?.restrict_content_to_departments || false}
              onCheckedChange={handleToggleRestriction}
              disabled={isUpdating}
            />
          </div>

          {settings?.restrict_content_to_departments && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Department restrictions are active.</strong> Users will only see growth ideas and experiments from their assigned departments. 
                Owners and admins can see all content regardless of department assignments.
              </AlertDescription>
            </Alert>
          )}

          {!settings?.restrict_content_to_departments && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Open access is active.</strong> All users can see all growth ideas and experiments within the company, 
                regardless of department assignments.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
    
    </div>
  );
};

export default ContentManagementSettings;
