
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CompanyContentSettings {
  id: string;
  company_id: string;
  restrict_content_to_departments: boolean;
  created_at: string;
  updated_at: string;
}

export const useCompanyContentSettings = (currentCompany?: { id: string } | null) => {
  const [settings, setSettings] = useState<CompanyContentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    if (currentCompany) {
      fetchSettings();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [currentCompany]);

  const fetchSettings = async () => {
    if (!currentCompany) return;

    try {
      const { data, error } = await supabase
        .from('company_content_settings')
        .select('*')
        .eq('company_id', currentCompany.id)
        .maybeSingle();

      if (error) throw error;
      
      setSettings(data);
    } catch (error: any) {
      console.error('Error fetching content settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch content settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (restrictToDepartments: boolean) => {
    if (!currentCompany) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (settings) {
        // Update existing settings
        const { data, error } = await supabase
          .from('company_content_settings')
          .update({ restrict_content_to_departments: restrictToDepartments })
          .eq('id', settings.id)
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('company_content_settings')
          .insert({
            company_id: currentCompany.id,
            restrict_content_to_departments: restrictToDepartments
          })
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
      }

      toast({
        title: 'Success',
        description: 'Content settings updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating content settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update content settings'
      });
    }
  };

  return {
    settings,
    loading,
    updateSettings,
    refetch: fetchSettings,
    restrictToDepartments: settings?.restrict_content_to_departments ?? false
  };
};
