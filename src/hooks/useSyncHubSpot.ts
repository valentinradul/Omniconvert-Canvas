import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/context/company/CompanyContext';
import { toast } from 'sonner';

interface SyncResult {
  success: boolean;
  recordsProcessed?: number;
  recordsCreated?: number;
  recordsUpdated?: number;
  results?: Record<string, number>;
  error?: string;
}

export function useSyncHubSpot() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: { 
      startDate?: string; 
      endDate?: string;
    }): Promise<SyncResult> => {
      if (!currentCompany?.id) throw new Error('No company selected');

      const { data, error } = await supabase.functions.invoke('hubspot-sync', {
        body: {
          action: 'sync',
          companyId: currentCompany.id,
          dateFrom: options?.startDate,
          dateTo: options?.endDate,
        },
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      return {
        success: true,
        recordsProcessed: data?.recordsProcessed || 0,
        recordsCreated: data?.recordsCreated || 0,
        recordsUpdated: data?.recordsUpdated || 0,
        results: data?.results,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reporting-metric-values'] });
      const total = (data.recordsCreated || 0) + (data.recordsUpdated || 0);
      toast.success(`Synced ${total} data points from HubSpot`);
    },
    onError: (error) => {
      console.error('HubSpot sync error:', error);
      toast.error(error.message || 'Failed to sync HubSpot data');
    },
  });
}
