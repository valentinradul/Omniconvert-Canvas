
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CompanyContentSettings {
  id: string;
  company_id: string;
  restrict_content_to_departments: boolean;
  created_at: string;
  updated_at: string;
}

export const useCompanyContentSettings = (companyId: string | null) => {
  const [settings, setSettings] = useState<CompanyContentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!companyId) {
      setSettings(null);
      return;
    }

    fetchSettings();
  }, [companyId]);

  const fetchSettings = async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_content_settings')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;

      setSettings(data);
    } catch (error: any) {
      console.error('Error fetching content settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load content settings'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (restrictContent: boolean) => {
    if (!companyId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Try to update existing settings first
      const { data: existingData, error: updateError } = await supabase
        .from('company_content_settings')
        .update({ restrict_content_to_departments: restrictContent })
        .eq('company_id', companyId)
        .select()
        .maybeSingle();

      if (updateError && updateError.code !== 'PGRST116') {
        throw updateError;
      }

      // If no existing record, create one
      if (!existingData) {
        const { data: newData, error: insertError } = await supabase
          .from('company_content_settings')
          .insert({
            company_id: companyId,
            restrict_content_to_departments: restrictContent
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newData);
      } else {
        setSettings(existingData);
      }

      toast({
        title: 'Settings updated',
        description: `Content visibility has been ${restrictContent ? 'restricted to departments' : 'opened to all members'}`
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
    isLoading,
    updateSettings,
    refreshSettings: fetchSettings
  };
};
