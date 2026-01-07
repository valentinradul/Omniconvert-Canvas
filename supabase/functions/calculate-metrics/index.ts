import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalculationFormula {
  type: 'division' | 'multiplication' | 'sum' | 'difference' | 
        'cumulative' | 'rolling_average' | 'year_to_date' | 'percentage_change';
  operands?: {
    numerator?: string;
    denominator?: string;
    metricIds?: string[];
  };
  sourceMetricId?: string;
  rollingPeriods?: number;
  format?: 'number' | 'percentage' | 'currency';
  decimalPlaces?: number;
  multiplyBy100?: boolean;
}

interface CalculateRequest {
  action: 'calculate' | 'preview';
  companyId: string;
  metricIds?: string[];
  startDate?: string;
  endDate?: string;
  storeResults?: boolean;
  // For preview mode
  formula?: CalculationFormula;
  previewPeriods?: string[];
}

// Get all periods before a given date (for cumulative/YTD)
function getAllPeriodsBefore(periods: string[], targetPeriod: string): string[] {
  const targetDate = new Date(targetPeriod);
  return periods.filter(p => new Date(p) <= targetDate).sort();
}

// Get N previous periods for rolling average
function getPreviousPeriods(periods: string[], targetPeriod: string, count: number): string[] {
  const sorted = [...periods].sort();
  const targetIndex = sorted.indexOf(targetPeriod);
  if (targetIndex === -1) return [];
  const startIndex = Math.max(0, targetIndex - count + 1);
  return sorted.slice(startIndex, targetIndex + 1);
}

// Get periods from start of year to target period (for YTD)
function getYearToDatePeriods(periods: string[], targetPeriod: string): string[] {
  const targetDate = new Date(targetPeriod);
  const yearStart = new Date(targetDate.getFullYear(), 0, 1);
  return periods.filter(p => {
    const d = new Date(p);
    return d >= yearStart && d <= targetDate;
  }).sort();
}

// Calculate a single value based on formula
function calculateValue(
  formula: CalculationFormula,
  periodDate: string,
  allValues: Map<string, Map<string, number | null>>,
  allPeriods: string[]
): number | null {
  try {
    switch (formula.type) {
      case 'division': {
        if (!formula.operands?.numerator || !formula.operands?.denominator) return null;
        const num = allValues.get(formula.operands.numerator)?.get(periodDate);
        const den = allValues.get(formula.operands.denominator)?.get(periodDate);
        if (num == null || den == null || den === 0) return null;
        let result = num / den;
        if (formula.multiplyBy100) result *= 100;
        return result;
      }

      case 'multiplication': {
        if (!formula.operands?.numerator || !formula.operands?.denominator) return null;
        const a = allValues.get(formula.operands.numerator)?.get(periodDate);
        const b = allValues.get(formula.operands.denominator)?.get(periodDate);
        if (a == null || b == null) return null;
        return a * b;
      }

      case 'sum': {
        if (!formula.operands?.metricIds?.length) return null;
        let sum = 0;
        let hasValue = false;
        for (const metricId of formula.operands.metricIds) {
          const val = allValues.get(metricId)?.get(periodDate);
          if (val != null) {
            sum += val;
            hasValue = true;
          }
        }
        return hasValue ? sum : null;
      }

      case 'difference': {
        if (!formula.operands?.numerator || !formula.operands?.denominator) return null;
        const a = allValues.get(formula.operands.numerator)?.get(periodDate);
        const b = allValues.get(formula.operands.denominator)?.get(periodDate);
        if (a == null || b == null) return null;
        return a - b;
      }

      case 'cumulative': {
        if (!formula.sourceMetricId) return null;
        const priorPeriods = getAllPeriodsBefore(allPeriods, periodDate);
        let sum = 0;
        let hasValue = false;
        for (const p of priorPeriods) {
          const val = allValues.get(formula.sourceMetricId)?.get(p);
          if (val != null) {
            sum += val;
            hasValue = true;
          }
        }
        return hasValue ? sum : null;
      }

      case 'rolling_average': {
        if (!formula.sourceMetricId || !formula.rollingPeriods) return null;
        const rollingPeriods = getPreviousPeriods(allPeriods, periodDate, formula.rollingPeriods);
        const values: number[] = [];
        for (const p of rollingPeriods) {
          const val = allValues.get(formula.sourceMetricId)?.get(p);
          if (val != null) values.push(val);
        }
        if (values.length === 0) return null;
        return values.reduce((a, b) => a + b, 0) / values.length;
      }

      case 'year_to_date': {
        if (!formula.sourceMetricId) return null;
        const ytdPeriods = getYearToDatePeriods(allPeriods, periodDate);
        let sum = 0;
        let hasValue = false;
        for (const p of ytdPeriods) {
          const val = allValues.get(formula.sourceMetricId)?.get(p);
          if (val != null) {
            sum += val;
            hasValue = true;
          }
        }
        return hasValue ? sum : null;
      }

      case 'percentage_change': {
        if (!formula.sourceMetricId) return null;
        const sorted = [...allPeriods].sort();
        const currentIndex = sorted.indexOf(periodDate);
        if (currentIndex <= 0) return null;
        const previousPeriod = sorted[currentIndex - 1];
        const current = allValues.get(formula.sourceMetricId)?.get(periodDate);
        const previous = allValues.get(formula.sourceMetricId)?.get(previousPeriod);
        if (current == null || previous == null || previous === 0) return null;
        return ((current - previous) / Math.abs(previous)) * 100;
      }

      default:
        return null;
    }
  } catch (error) {
    console.error(`Error calculating value for period ${periodDate}:`, error);
    return null;
  }
}

// Format value based on formula settings
function formatResult(value: number | null, formula: CalculationFormula): number | null {
  if (value === null) return null;
  const decimals = formula.decimalPlaces ?? 2;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CalculateRequest = await req.json();
    console.log('Calculate metrics request:', JSON.stringify(body, null, 2));

    const { action, companyId, metricIds, startDate, endDate, storeResults, formula, previewPeriods } = body;

    if (!companyId) {
      throw new Error('companyId is required');
    }

    // Preview mode: calculate values for a formula without saving
    if (action === 'preview') {
      if (!formula || !previewPeriods?.length) {
        throw new Error('formula and previewPeriods are required for preview');
      }

      // Get all source metric IDs needed for this formula
      const sourceMetricIds: string[] = [];
      if (formula.operands?.numerator) sourceMetricIds.push(formula.operands.numerator);
      if (formula.operands?.denominator) sourceMetricIds.push(formula.operands.denominator);
      if (formula.operands?.metricIds) sourceMetricIds.push(...formula.operands.metricIds);
      if (formula.sourceMetricId) sourceMetricIds.push(formula.sourceMetricId);

      // Fetch source metric values
      const { data: sourceValues, error: valuesError } = await supabase
        .from('reporting_metric_values')
        .select('*')
        .in('metric_id', sourceMetricIds)
        .order('period_date', { ascending: true });

      if (valuesError) throw valuesError;

      // Build values map
      const valuesMap = new Map<string, Map<string, number | null>>();
      for (const v of sourceValues || []) {
        if (!valuesMap.has(v.metric_id)) {
          valuesMap.set(v.metric_id, new Map());
        }
        valuesMap.get(v.metric_id)!.set(v.period_date, v.value);
      }

      // Get all available periods for time-based calculations
      const allPeriods = [...new Set((sourceValues || []).map(v => v.period_date))].sort();

      // Calculate preview values
      const results: Record<string, number | null> = {};
      for (const period of previewPeriods) {
        const raw = calculateValue(formula, period, valuesMap, allPeriods);
        results[period] = formatResult(raw, formula);
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate mode: calculate values for existing calculated metrics
    if (action === 'calculate') {
      // Fetch calculated metrics for this company
      let metricsQuery = supabase
        .from('reporting_metrics')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_calculated', true);

      if (metricIds?.length) {
        metricsQuery = metricsQuery.in('id', metricIds);
      }

      const { data: calculatedMetrics, error: metricsError } = await metricsQuery;
      if (metricsError) throw metricsError;

      if (!calculatedMetrics?.length) {
        return new Response(JSON.stringify({ results: {} }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Found ${calculatedMetrics.length} calculated metrics`);

      // Collect all source metric IDs
      const allSourceMetricIds = new Set<string>();
      const metricFormulas = new Map<string, CalculationFormula>();

      for (const metric of calculatedMetrics) {
        if (!metric.calculation_formula) continue;
        try {
          const formula: CalculationFormula = JSON.parse(metric.calculation_formula);
          metricFormulas.set(metric.id, formula);
          
          if (formula.operands?.numerator) allSourceMetricIds.add(formula.operands.numerator);
          if (formula.operands?.denominator) allSourceMetricIds.add(formula.operands.denominator);
          if (formula.operands?.metricIds) formula.operands.metricIds.forEach(id => allSourceMetricIds.add(id));
          if (formula.sourceMetricId) allSourceMetricIds.add(formula.sourceMetricId);
        } catch (e) {
          console.error(`Failed to parse formula for metric ${metric.id}:`, e);
        }
      }

      // Fetch all source metric values
      let valuesQuery = supabase
        .from('reporting_metric_values')
        .select('*')
        .in('metric_id', Array.from(allSourceMetricIds))
        .order('period_date', { ascending: true });

      if (startDate) valuesQuery = valuesQuery.gte('period_date', startDate);
      if (endDate) valuesQuery = valuesQuery.lte('period_date', endDate);

      const { data: sourceValues, error: valuesError } = await valuesQuery;
      if (valuesError) throw valuesError;

      // Build values map
      const valuesMap = new Map<string, Map<string, number | null>>();
      for (const v of sourceValues || []) {
        if (!valuesMap.has(v.metric_id)) {
          valuesMap.set(v.metric_id, new Map());
        }
        valuesMap.get(v.metric_id)!.set(v.period_date, v.value);
      }

      // Get all available periods
      const allPeriods = [...new Set((sourceValues || []).map(v => v.period_date))].sort();

      // Calculate values for each metric
      const results: Record<string, Record<string, number | null>> = {};

      for (const metric of calculatedMetrics) {
        const formula = metricFormulas.get(metric.id);
        if (!formula) continue;

        results[metric.id] = {};
        for (const period of allPeriods) {
          const raw = calculateValue(formula, period, valuesMap, allPeriods);
          results[metric.id][period] = formatResult(raw, formula);
        }
      }

      // Optionally store results
      if (storeResults) {
        const valuesToUpsert: { metric_id: string; period_date: string; value: number | null; is_manual_override: boolean }[] = [];
        
        for (const [metricId, periodValues] of Object.entries(results)) {
          for (const [periodDate, value] of Object.entries(periodValues)) {
            valuesToUpsert.push({
              metric_id: metricId,
              period_date: periodDate,
              value,
              is_manual_override: false,
            });
          }
        }

        if (valuesToUpsert.length > 0) {
          const { error: upsertError } = await supabase
            .from('reporting_metric_values')
            .upsert(valuesToUpsert, { onConflict: 'metric_id,period_date' });

          if (upsertError) {
            console.error('Error storing calculated values:', upsertError);
          } else {
            console.log(`Stored ${valuesToUpsert.length} calculated values`);
          }
        }
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('Error in calculate-metrics function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
