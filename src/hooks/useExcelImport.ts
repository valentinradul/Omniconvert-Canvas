import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/context/company/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ImportData {
  newMetrics: { name: string; categoryId: string }[];
  values: { metricId: string; metricName: string; periodDate: string; value: number }[];
}

export function useExcelImport() {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ImportData) => {
      if (!currentCompany?.id) throw new Error('No company selected');
      if (!user?.id) throw new Error('Not authenticated');

      const results = {
        metricsCreated: 0,
        valuesInserted: 0,
        valuesUpdated: 0,
      };

      // Create a map of metric names to IDs
      const metricNameToId: Record<string, string> = {};

      // Pre-populate with existing metrics
      for (const val of data.values) {
        if (val.metricId) {
          metricNameToId[val.metricName.toLowerCase()] = val.metricId;
        }
      }

      // Create new metrics if any
      if (data.newMetrics.length > 0) {
        const { data: createdMetrics, error: createError } = await supabase
          .from('reporting_metrics')
          .insert(
            data.newMetrics.map((m, idx) => ({
              name: m.name,
              category_id: m.categoryId,
              company_id: currentCompany.id,
              created_by: user.id,
              source: 'Manual',
              is_calculated: false,
              sort_order: idx,
            }))
          )
          .select();

        if (createError) throw createError;

        // Map new metric names to their IDs
        createdMetrics?.forEach(metric => {
          metricNameToId[metric.name.toLowerCase()] = metric.id;
        });

        results.metricsCreated = createdMetrics?.length || 0;
      }

      // Prepare values for upsert
      const valuesToUpsert = data.values
        .map(v => {
          const metricId = v.metricId || metricNameToId[v.metricName.toLowerCase()];
          if (!metricId) return null;
          
          return {
            metric_id: metricId,
            period_date: v.periodDate,
            value: v.value,
            is_manual_override: true,
            updated_by: user.id,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);

      if (valuesToUpsert.length > 0) {
        // Batch upsert in chunks to avoid hitting limits
        const chunkSize = 500;
        for (let i = 0; i < valuesToUpsert.length; i += chunkSize) {
          const chunk = valuesToUpsert.slice(i, i + chunkSize);
          
          const { error: upsertError } = await supabase
            .from('reporting_metric_values')
            .upsert(chunk, {
              onConflict: 'metric_id,period_date',
            });

          if (upsertError) throw upsertError;
        }

        results.valuesInserted = valuesToUpsert.length;
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['reporting-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['reporting-metric-values'] });
      
      const messages: string[] = [];
      if (results.metricsCreated > 0) {
        messages.push(`${results.metricsCreated} metrics created`);
      }
      if (results.valuesInserted > 0) {
        messages.push(`${results.valuesInserted} values imported`);
      }
      
      toast.success(`Import complete: ${messages.join(', ')}`);
    },
    onError: (error) => {
      console.error('Excel import error:', error);
      toast.error('Failed to import Excel data');
    },
  });
}
