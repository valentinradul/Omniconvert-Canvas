
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('company_content_settings')
        .select('*')
        .eq('company_id', currentCompany.id)
        .single();

      if (error) {
        // If no settings exist, create default ones
        if (error.code === 'PGRST116') {
          const { data: newSettings, error: createError } = await supabase
            .from('company_content_settings')
            .insert({
              company_id: currentCompany.id,
              restrict_content_to_departments: false
            })
            .select()
            .single();

          if (createError) throw createError;
          setSettings(newSettings);
        } else {
          throw error;
        }
      } else {
        setSettings(data);
      }
    } catch (error: any) {
      console.error('Error fetching company content settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch content settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (restrictContent: boolean) => {
    if (!currentCompany || !settings) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('company_content_settings')
        .update({
          restrict_content_to_departments: restrictContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(prev => prev ? {
        ...prev,
        restrict_content_to_departments: restrictContent,
        updated_at: new Date().toISOString()
      } : null);

      toast({
        title: 'Settings updated',
        description: 'Content visibility settings have been updated successfully.'
      });
    } catch (error: any) {
      console.error('Error updating company content settings:', error);
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
    refetch: fetchSettings
  };
};
