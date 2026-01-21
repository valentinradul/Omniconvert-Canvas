import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/context/company/CompanyContext';

interface GAPeriodTotalsResult {
  success: boolean;
  data?: Record<string, number>;
  dateRange?: { startDate: string; endDate: string };
  error?: string;
}

export function useFetchGAPeriodTotals(startDate: string, endDate: string, enabled = true) {
  const { currentCompany } = useCompany();

  return useQuery({
    queryKey: ['ga-period-totals', currentCompany?.id, startDate, endDate],
    queryFn: async (): Promise<GAPeriodTotalsResult> => {
      if (!currentCompany?.id) throw new Error('No company selected');

      const { data, error } = await supabase.functions.invoke('fetch-google-analytics', {
        body: {
          action: 'fetch-period-totals',
          companyId: currentCompany.id,
          startDate,
          endDate,
        },
      });

      if (error) throw error;
      return data as GAPeriodTotalsResult;
    },
    enabled: enabled && !!currentCompany?.id && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
