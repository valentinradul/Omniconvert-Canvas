import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/context/company/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { SavedChart } from '@/types/reporting';
import { Granularity } from '@/reporting/components/GranularitySelector';

export function useSavedCharts() {
  const { currentCompany } = useCompany();

  return useQuery({
    queryKey: ['saved-charts', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      
      const { data, error } = await supabase
        .from('saved_charts')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SavedChart[];
    },
    enabled: !!currentCompany?.id,
  });
}

export function useCreateSavedChart() {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chart: {
      name: string;
      metric_ids: string[];
      chart_type?: 'line' | 'bar';
      date_range_preset?: string;
      custom_start_date?: string;
      custom_end_date?: string;
      granularity?: Granularity;
    }) => {
      if (!currentCompany?.id) throw new Error('No company selected');

      const { data, error } = await supabase
        .from('saved_charts')
        .insert({
          company_id: currentCompany.id,
          name: chart.name,
          metric_ids: chart.metric_ids,
          chart_type: chart.chart_type || 'line',
          date_range_preset: chart.date_range_preset,
          custom_start_date: chart.custom_start_date,
          custom_end_date: chart.custom_end_date,
          granularity: chart.granularity || 'month',
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-charts'] });
      toast.success('Chart saved successfully');
    },
    onError: (error) => {
      console.error('Error saving chart:', error);
      toast.error('Failed to save chart');
    },
  });
}

export function useDeleteSavedChart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chartId: string) => {
      const { error } = await supabase
        .from('saved_charts')
        .delete()
        .eq('id', chartId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-charts'] });
      toast.success('Chart deleted');
    },
    onError: (error) => {
      console.error('Error deleting chart:', error);
      toast.error('Failed to delete chart');
    },
  });
}