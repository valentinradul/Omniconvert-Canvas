import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/context/company/CompanyContext';
import { toast } from 'sonner';

interface SyncResult {
  success: boolean;
  recordsProcessed?: number;
  metricsUpdated?: string[];
  error?: string;
}

export function useSyncGoogleAnalytics() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: { 
      startDate?: string; 
      endDate?: string;
      metricIds?: string[];
    }): Promise<SyncResult> => {
      if (!currentCompany?.id) throw new Error('No company selected');

      const { data, error } = await supabase.functions.invoke('fetch-google-analytics', {
        body: {
          action: 'sync-reporting-metrics',
          companyId: currentCompany.id,
          startDate: options?.startDate,
          endDate: options?.endDate,
          metricIds: options?.metricIds,
        },
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Sync failed');
      }

      return data as SyncResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reporting-metric-values'] });
      toast.success(`Synced ${data.recordsProcessed || 0} data points from Google Analytics`);
    },
    onError: (error) => {
      console.error('GA sync error:', error);
      toast.error(error.message || 'Failed to sync Google Analytics data');
    },
  });
}
