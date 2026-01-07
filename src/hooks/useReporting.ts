import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/context/company/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { 
  ReportingCategory, 
  ReportingMetric, 
  ReportingMetricValue,
  CalculationFormula,
  DEFAULT_CATEGORIES 
} from '@/types/reporting';

export function useReportingCategories() {
  const { currentCompany } = useCompany();

  return useQuery({
    queryKey: ['reporting-categories', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      
      const { data, error } = await supabase
        .from('reporting_categories')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as ReportingCategory[];
    },
    enabled: !!currentCompany?.id,
  });
}

export function useInitializeReportingCategories() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!currentCompany?.id) throw new Error('No company selected');

      // Check if categories already exist
      const { data: existing } = await supabase
        .from('reporting_categories')
        .select('id')
        .eq('company_id', currentCompany.id)
        .limit(1);

      if (existing && existing.length > 0) {
        return existing;
      }

      // Create parent categories first
      const parentCategories = DEFAULT_CATEGORIES.filter(c => !c.parent_slug);
      const parentInserts = parentCategories.map(c => ({
        company_id: currentCompany.id,
        name: c.name,
        slug: c.slug,
        parent_id: null,
        sort_order: c.sort_order,
      }));

      const { data: insertedParents, error: parentError } = await supabase
        .from('reporting_categories')
        .insert(parentInserts)
        .select();

      if (parentError) throw parentError;

      // Create a mapping of slug to id for parents
      const slugToId: Record<string, string> = {};
      insertedParents?.forEach(p => {
        slugToId[p.slug] = p.id;
      });

      // Create child categories
      const childCategories = DEFAULT_CATEGORIES.filter(c => c.parent_slug);
      const childInserts = childCategories.map(c => ({
        company_id: currentCompany.id,
        name: c.name,
        slug: c.slug,
        parent_id: slugToId[c.parent_slug!],
        sort_order: c.sort_order,
      }));

      const { data: insertedChildren, error: childError } = await supabase
        .from('reporting_categories')
        .insert(childInserts)
        .select();

      if (childError) throw childError;

      return [...(insertedParents || []), ...(insertedChildren || [])];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reporting-categories'] });
    },
    onError: (error) => {
      console.error('Error initializing categories:', error);
      toast.error('Failed to initialize reporting categories');
    },
  });
}

export function useReportingMetrics(categoryId?: string) {
  const { currentCompany } = useCompany();

  return useQuery({
    queryKey: ['reporting-metrics', currentCompany?.id, categoryId],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      
      let query = supabase
        .from('reporting_metrics')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('sort_order', { ascending: true });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ReportingMetric[];
    },
    enabled: !!currentCompany?.id,
  });
}

export function useReportingMetricValues(metricIds: string[], startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reporting-metric-values', metricIds, startDate, endDate],
    queryFn: async () => {
      if (metricIds.length === 0) return [];
      
      let query = supabase
        .from('reporting_metric_values')
        .select('*')
        .in('metric_id', metricIds)
        .order('period_date', { ascending: true });

      if (startDate) {
        query = query.gte('period_date', startDate);
      }
      if (endDate) {
        query = query.lte('period_date', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ReportingMetricValue[];
    },
    enabled: metricIds.length > 0,
  });
}

export function useCreateMetric() {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (metric: {
      category_id: string;
      name: string;
      source?: string;
      integration_type?: string | null;
      sort_order?: number;
    }) => {
      if (!currentCompany?.id) throw new Error('No company selected');

      const { data, error } = await supabase
        .from('reporting_metrics')
        .insert({
          category_id: metric.category_id,
          name: metric.name,
          source: metric.source,
          integration_type: metric.integration_type,
          sort_order: metric.sort_order ?? 0,
          company_id: currentCompany.id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reporting-metrics'] });
      toast.success('Metric created successfully');
    },
    onError: (error) => {
      console.error('Error creating metric:', error);
      toast.error('Failed to create metric');
    },
  });
}

export function useUpdateMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ReportingMetric> & { id: string }) => {
      // Handle visible_in_categories separately as it needs proper typing
      const updateData: Record<string, unknown> = { ...updates };
      
      const { data, error } = await supabase
        .from('reporting_metrics')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reporting-metrics'] });
      toast.success('Metric updated successfully');
    },
    onError: (error) => {
      console.error('Error updating metric:', error);
      toast.error('Failed to update metric');
    },
  });
}

export function useDeleteMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reporting_metrics')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reporting-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['reporting-metric-values'] });
      toast.success('Metric deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting metric:', error);
      toast.error('Failed to delete metric');
    },
  });
}

export function useUpsertMetricValue() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      metricId, 
      periodDate, 
      value,
      isManualOverride = true 
    }: { 
      metricId: string; 
      periodDate: string; 
      value: number | null;
      isManualOverride?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('reporting_metric_values')
        .upsert({
          metric_id: metricId,
          period_date: periodDate,
          value,
          is_manual_override: isManualOverride,
          updated_by: user?.id,
        }, {
          onConflict: 'metric_id,period_date',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reporting-metric-values'] });
    },
    onError: (error) => {
      console.error('Error updating metric value:', error);
      toast.error('Failed to update value');
    },
  });
}

export function useCreateCalculatedMetric() {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      category_id: string;
      name: string;
      formula: CalculationFormula;
    }) => {
      if (!currentCompany?.id) throw new Error('No company selected');

      const { data: metric, error } = await supabase
        .from('reporting_metrics')
        .insert({
          category_id: data.category_id,
          name: data.name,
          is_calculated: true,
          calculation_formula: JSON.stringify(data.formula),
          source: 'Calculated',
          integration_type: null,
          company_id: currentCompany.id,
          created_by: user?.id,
          sort_order: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return metric;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reporting-metrics'] });
      toast.success('Calculated metric created successfully');
    },
    onError: (error) => {
      console.error('Error creating calculated metric:', error);
      toast.error('Failed to create calculated metric');
    },
  });
}

export function useUpdateCalculatedMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      formula: CalculationFormula;
    }) => {
      const { data: metric, error } = await supabase
        .from('reporting_metrics')
        .update({
          name: data.name,
          calculation_formula: JSON.stringify(data.formula),
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return metric;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reporting-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['calculated-metric-values'] });
      toast.success('Calculated metric updated successfully');
    },
    onError: (error) => {
      console.error('Error updating calculated metric:', error);
      toast.error('Failed to update calculated metric');
    },
  });
}

export function useCalculatedMetricValues(
  metricIds: string[],
  startDate?: string,
  endDate?: string
) {
  const { currentCompany } = useCompany();

  return useQuery({
    queryKey: ['calculated-metric-values', currentCompany?.id, metricIds, startDate, endDate],
    queryFn: async () => {
      if (!currentCompany?.id || metricIds.length === 0) return {};

      const { data, error } = await supabase.functions.invoke('calculate-metrics', {
        body: {
          action: 'calculate',
          companyId: currentCompany.id,
          metricIds,
          startDate,
          endDate,
          storeResults: false,
        },
      });

      if (error) throw error;
      return data.results as Record<string, Record<string, number | null>>;
    },
    enabled: !!currentCompany?.id && metricIds.length > 0,
    staleTime: 30000, // 30 seconds
  });
}

export function useRecalculateMetrics() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      metricIds?: string[];
      startDate?: string;
      endDate?: string;
      storeResults?: boolean;
    }) => {
      if (!currentCompany?.id) throw new Error('No company selected');

      const { data: result, error } = await supabase.functions.invoke('calculate-metrics', {
        body: {
          action: 'calculate',
          companyId: currentCompany.id,
          ...data,
        },
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculated-metric-values'] });
      queryClient.invalidateQueries({ queryKey: ['reporting-metric-values'] });
      toast.success('Metrics recalculated successfully');
    },
    onError: (error) => {
      console.error('Error recalculating metrics:', error);
      toast.error('Failed to recalculate metrics');
    },
  });
}
