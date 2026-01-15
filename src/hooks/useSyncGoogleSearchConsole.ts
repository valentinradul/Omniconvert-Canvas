import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/context/company/CompanyContext';
import { toast } from 'sonner';

interface SyncResult {
  success: boolean;
  recordsProcessed?: number;
  syncedMetrics?: string[];
  monthsProcessed?: number;
  error?: string;
}

export function useSyncGoogleSearchConsole() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: { 
      startDate?: string; 
      endDate?: string;
    }): Promise<SyncResult> => {
      if (!currentCompany?.id) throw new Error('No company selected');

      const { data, error } = await supabase.functions.invoke('fetch-google-search-console', {
        body: {
          action: 'sync-reporting-metrics',
          companyId: currentCompany.id,
          startDate: options?.startDate,
          endDate: options?.endDate,
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
      toast.success(`Synced ${data.recordsProcessed || 0} data points from Google Search Console`);
    },
    onError: (error) => {
      console.error('GSC sync error:', error);
      toast.error(error.message || 'Failed to sync Google Search Console data');
    },
  });
}
