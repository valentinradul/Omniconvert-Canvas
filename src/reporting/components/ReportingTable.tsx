import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, RefreshCw } from 'lucide-react';
import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, eachQuarterOfInterval, eachYearOfInterval } from 'date-fns';
import { MetricRow } from './MetricRow';
import { AddMetricDialog } from './AddMetricDialog';
import { IntegrationDialog } from './IntegrationDialog';
import { MetricVisibilityDialog } from './MetricVisibilityDialog';
import { DateRangePicker } from './DateRangePicker';
import { GranularitySelector, Granularity } from './GranularitySelector';
import { ReportingMetric, ReportingMetricValue, ReportingCategory } from '@/types/reporting';
import {
  useCreateMetric,
  useUpdateMetric,
  useDeleteMetric,
  useUpsertMetricValue,
} from '@/hooks/useReporting';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ReportingTableProps {
  category: ReportingCategory;
  metrics: ReportingMetric[];
  allMetrics?: ReportingMetric[]; // For cross-category visibility
  values: ReportingMetricValue[];
  categories?: ReportingCategory[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

interface DateRange {
  from: Date;
  to: Date;
}

const generatePeriods = (dateRange: DateRange, granularity: Granularity): string[] => {
  const periods: string[] = [];
  
  switch (granularity) {
    case 'day':
      eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).forEach(date => {
        periods.push(format(date, 'yyyy-MM-dd'));
      });
      break;
    case 'week':
      eachWeekOfInterval({ start: dateRange.from, end: dateRange.to }, { weekStartsOn: 1 }).forEach(date => {
        periods.push(format(date, 'yyyy-MM-dd'));
      });
      break;
    case 'month':
      eachMonthOfInterval({ start: dateRange.from, end: dateRange.to }).forEach(date => {
        periods.push(format(startOfMonth(date), 'yyyy-MM-dd'));
      });
      break;
    case 'quarter':
      eachQuarterOfInterval({ start: dateRange.from, end: dateRange.to }).forEach(date => {
        periods.push(format(startOfQuarter(date), 'yyyy-MM-dd'));
      });
      break;
    case 'year':
      eachYearOfInterval({ start: dateRange.from, end: dateRange.to }).forEach(date => {
        periods.push(format(startOfYear(date), 'yyyy-MM-dd'));
      });
      break;
  }
  
  return periods;
};

const formatPeriodHeader = (period: string, granularity: Granularity): string => {
  const date = new Date(period);
  switch (granularity) {
    case 'day':
      return format(date, 'MMM d, yyyy');
    case 'week':
      return `W${format(date, 'w yyyy')}`;
    case 'month':
      return format(date, 'MMM yyyy');
    case 'quarter':
      return `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`;
    case 'year':
      return format(date, 'yyyy');
    default:
      return format(date, 'MMM yyyy');
  }
};

// Aggregate values for grouped periods
const aggregateValue = (
  values: Record<string, ReportingMetricValue>,
  periodStart: string,
  granularity: Granularity,
  dateRange: DateRange
): number | null => {
  const startDate = new Date(periodStart);
  let endDate: Date;
  
  switch (granularity) {
    case 'week':
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      break;
    case 'month':
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      break;
    case 'quarter':
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0);
      break;
    case 'year':
      endDate = new Date(startDate.getFullYear(), 11, 31);
      break;
    default:
      endDate = startDate;
  }
  
  // Clamp to date range
  if (endDate > dateRange.to) endDate = dateRange.to;
  
  let sum = 0;
  let count = 0;
  
  // For monthly data, just get the value for the period date
  const periodValue = values[periodStart];
  if (periodValue?.value !== null && periodValue?.value !== undefined) {
    return periodValue.value;
  }
  
  return null;
};

export const ReportingTable: React.FC<ReportingTableProps> = ({
  category,
  metrics,
  allMetrics = [],
  values,
  categories = [],
  isLoading,
  onRefresh,
}) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [integrationDialogOpen, setIntegrationDialogOpen] = useState(false);
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<ReportingMetric | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [metricToDelete, setMetricToDelete] = useState<string | null>(null);
  
  // Date range defaults to 2024
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(2024, 0, 1),
    to: new Date(2024, 11, 31),
  });
  const [granularity, setGranularity] = useState<Granularity>('month');

  const createMetric = useCreateMetric();
  const updateMetric = useUpdateMetric();
  const deleteMetric = useDeleteMetric();
  const upsertValue = useUpsertMetricValue();

  const periods = useMemo(() => generatePeriods(dateRange, granularity), [dateRange, granularity]);

  // Get metrics visible in this category (both native and shared)
  const visibleMetrics = useMemo(() => {
    const nativeMetrics = metrics;
    const sharedMetrics = allMetrics.filter(m => 
      m.category_id !== category.id && 
      m.visible_in_categories?.includes(category.id)
    );
    return { native: nativeMetrics, shared: sharedMetrics };
  }, [metrics, allMetrics, category.id]);

  // Group values by metric and period
  const valuesByMetric = useMemo(() => {
    const grouped: Record<string, Record<string, ReportingMetricValue>> = {};
    values.forEach((v) => {
      if (!grouped[v.metric_id]) {
        grouped[v.metric_id] = {};
      }
      grouped[v.metric_id][v.period_date] = v;
    });
    return grouped;
  }, [values]);

  const handleAddMetric = (data: { name: string; source: string; integration_type: string | null }) => {
    createMetric.mutate({
      category_id: category.id,
      name: data.name,
      source: data.source,
      integration_type: data.integration_type,
      sort_order: metrics.length,
    }, {
      onSuccess: () => setAddDialogOpen(false),
    });
  };

  const handleValueChange = (metricId: string, periodDate: string, value: number | null) => {
    upsertValue.mutate({
      metricId,
      periodDate,
      value,
      isManualOverride: true,
    });
  };

  const handleDelete = (metricId: string) => {
    setMetricToDelete(metricId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (metricToDelete) {
      deleteMetric.mutate(metricToDelete);
      setDeleteDialogOpen(false);
      setMetricToDelete(null);
    }
  };

  const handleEdit = (metric: ReportingMetric) => {
    setSelectedMetric(metric);
    setIntegrationDialogOpen(true);
  };

  const handleConnectIntegration = (metric: ReportingMetric) => {
    setSelectedMetric(metric);
    setIntegrationDialogOpen(true);
  };

  const handleShowInViews = (metric: ReportingMetric) => {
    setSelectedMetric(metric);
    setVisibilityDialogOpen(true);
  };

  const handleIntegrationConnect = (metricId: string, integrationType: string | null) => {
    updateMetric.mutate({
      id: metricId,
      integration_type: integrationType,
    }, {
      onSuccess: () => setIntegrationDialogOpen(false),
    });
  };

  const handleVisibilitySubmit = (metricId: string, categoryIds: string[]) => {
    updateMetric.mutate({
      id: metricId,
      visible_in_categories: categoryIds,
    }, {
      onSuccess: () => setVisibilityDialogOpen(false),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold">{category.name}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <GranularitySelector value={granularity} onChange={setGranularity} />
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Metric
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="w-full">
          <div className="min-w-max">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="sticky left-0 bg-muted z-20 px-3 py-2 text-left text-sm font-semibold border-r border-border min-w-[200px]">
                    Metric
                  </th>
                  <th className="sticky left-[200px] bg-muted z-20 px-3 py-2 text-left text-sm font-semibold border-r border-border min-w-[120px]">
                    Source
                  </th>
                  {periods.map((period) => (
                    <th 
                      key={period} 
                      className="px-2 py-2 text-right text-sm font-semibold border-r border-border min-w-[100px]"
                    >
                      {formatPeriodHeader(period, granularity)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleMetrics.native.length === 0 && visibleMetrics.shared.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={periods.length + 2} 
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No metrics defined yet. Click "Add Metric" to get started.
                    </td>
                  </tr>
                ) : (
                  <>
                    {visibleMetrics.native.map((metric) => (
                      <MetricRow
                        key={metric.id}
                        metric={metric}
                        values={valuesByMetric[metric.id] || {}}
                        periods={periods}
                        onValueChange={handleValueChange}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        onConnectIntegration={handleConnectIntegration}
                        onShowInViews={handleShowInViews}
                        isFromOtherCategory={false}
                      />
                    ))}
                    {visibleMetrics.shared.map((metric) => (
                      <MetricRow
                        key={metric.id}
                        metric={metric}
                        values={valuesByMetric[metric.id] || {}}
                        periods={periods}
                        onValueChange={handleValueChange}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        onConnectIntegration={handleConnectIntegration}
                        isFromOtherCategory={true}
                      />
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <AddMetricDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddMetric}
        isLoading={createMetric.isPending}
      />

      <IntegrationDialog
        open={integrationDialogOpen}
        onOpenChange={setIntegrationDialogOpen}
        metric={selectedMetric}
        onConnect={handleIntegrationConnect}
        isLoading={updateMetric.isPending}
      />

      <MetricVisibilityDialog
        open={visibilityDialogOpen}
        onOpenChange={setVisibilityDialogOpen}
        metric={selectedMetric}
        categories={categories}
        currentCategoryId={category.id}
        onSubmit={handleVisibilitySubmit}
        isLoading={updateMetric.isPending}
        existingVisibility={selectedMetric?.visible_in_categories || []}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Metric</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this metric? This will also delete all associated values.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
