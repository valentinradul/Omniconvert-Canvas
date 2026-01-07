import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/context/company/CompanyContext';

interface ContentSettings {
  id: string;
  company_id: string;
  restrict_content_to_departments: boolean;
  enable_financial_tracking: boolean;
  enable_gtm_calculator: boolean;
  enable_reporting: boolean;
}

export const useContentSettings = () => {
  const { currentCompany } = useCompany();

  return useQuery({
    queryKey: ['content-settings', currentCompany?.id],
    queryFn: async (): Promise<ContentSettings | null> => {
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
            restrict_content_to_departments: false,
            enable_financial_tracking: true,
            enable_gtm_calculator: false
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
};