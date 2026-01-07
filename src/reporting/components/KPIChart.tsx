import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, startOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Save } from 'lucide-react';
import { ReportingMetric, ReportingMetricValue } from '@/types/reporting';
import { Granularity } from './GranularitySelector';

interface KPIChartProps {
  metrics: ReportingMetric[];
  values: ReportingMetricValue[];
  periods: string[];
  granularity: Granularity;
  chartType?: 'line' | 'bar';
  onClose?: () => void;
  onSave?: () => void;
  title?: string;
  showSaveButton?: boolean;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
];

const formatPeriodLabel = (period: string, granularity: Granularity): string => {
  const date = new Date(period);
  switch (granularity) {
    case 'day':
      return format(date, 'MMM d');
    case 'week':
      return `W${format(date, 'w')}`;
    case 'month':
      return format(date, 'MMM');
    case 'quarter':
      return `Q${Math.ceil((date.getMonth() + 1) / 3)}`;
    case 'year':
      return format(date, 'yyyy');
    default:
      return format(date, 'MMM');
  }
};

export const KPIChart: React.FC<KPIChartProps> = ({
  metrics,
  values,
  periods,
  granularity,
  chartType = 'line',
  onClose,
  onSave,
  title = 'KPI Chart',
  showSaveButton = true,
}) => {
  // Group values by metric (store all monthly values for aggregation)
  const valuesByMetric = useMemo(() => {
    const grouped: Record<string, Record<string, number | null>> = {};
    values.forEach((v) => {
      if (!grouped[v.metric_id]) {
        grouped[v.metric_id] = {};
      }
      grouped[v.metric_id][v.period_date] = v.value;
    });
    return grouped;
  }, [values]);

  // Aggregate values for quarter/year granularity
  const aggregateValue = (
    metricValues: Record<string, number | null> | undefined,
    periodStart: string,
    gran: Granularity
  ): number | null => {
    if (!metricValues) return null;
    
    // For month or smaller, just return the period value
    if (gran === 'month' || gran === 'week' || gran === 'day') {
      return metricValues[periodStart] ?? null;
    }
    
    const startDate = new Date(periodStart);
    let monthsToSum: string[] = [];
    
    if (gran === 'quarter') {
      for (let i = 0; i < 3; i++) {
        const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        monthsToSum.push(format(startOfMonth(monthDate), 'yyyy-MM-dd'));
      }
    } else if (gran === 'year') {
      for (let i = 0; i < 12; i++) {
        const monthDate = new Date(startDate.getFullYear(), i, 1);
        monthsToSum.push(format(startOfMonth(monthDate), 'yyyy-MM-dd'));
      }
    }
    
    let sum = 0;
    let hasAnyValue = false;
    
    for (const monthKey of monthsToSum) {
      const value = metricValues[monthKey];
      if (value !== null && value !== undefined) {
        sum += value;
        hasAnyValue = true;
      }
    }
    
    return hasAnyValue ? sum : null;
  };

  // Build chart data with aggregation
  const chartData = useMemo(() => {
    return periods.map((period) => {
      const dataPoint: Record<string, string | number | null> = {
        period: formatPeriodLabel(period, granularity),
        fullPeriod: period,
      };
      
      metrics.forEach((metric) => {
        dataPoint[metric.id] = aggregateValue(valuesByMetric[metric.id], period, granularity);
      });
      
      return dataPoint;
    });
  }, [periods, metrics, valuesByMetric, granularity]);

  // Format large numbers
  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  if (metrics.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Select up to 4 KPIs to display a chart
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {showSaveButton && onSave && (
              <Button variant="outline" size="sm" onClick={onSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Chart
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {metrics.map((metric, index) => (
            <div key={metric.id} className="flex items-center gap-1.5 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span>{metric.name}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="period" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tickFormatter={formatValue}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number, name: string) => {
                    const metric = metrics.find(m => m.id === name);
                    return [formatValue(value), metric?.name || name];
                  }}
                />
                <Legend />
                {metrics.map((metric, index) => (
                  <Bar
                    key={metric.id}
                    dataKey={metric.id}
                    name={metric.name}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="period" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tickFormatter={formatValue}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number, name: string) => {
                    const metric = metrics.find(m => m.id === name);
                    return [formatValue(value), metric?.name || name];
                  }}
                />
                <Legend />
                {metrics.map((metric, index) => (
                  <Line
                    key={metric.id}
                    type="monotone"
                    dataKey={metric.id}
                    name={metric.name}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};