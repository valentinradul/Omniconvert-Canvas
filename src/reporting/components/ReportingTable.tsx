import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, RefreshCw, BarChart3, LineChart, Calculator, Upload, Trash2, CloudDownload } from 'lucide-react';
import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, eachQuarterOfInterval, eachYearOfInterval } from 'date-fns';
import { MetricRow } from './MetricRow';
import { AddMetricDialog } from './AddMetricDialog';
import { FormulaBuilderDialog } from './FormulaBuilderDialog';
import { IntegrationDialog } from './IntegrationDialog';
import { MetricVisibilityDialog } from './MetricVisibilityDialog';
import { ExcelImportDialog } from './ExcelImportDialog';
import { DateRangePicker } from './DateRangePicker';
import { GranularitySelector, Granularity } from './GranularitySelector';
import { KPIChart } from './KPIChart';
import { KPISelector } from './KPISelector';
import { SaveChartDialog } from './SaveChartDialog';
import { SavedChartsPanel } from './SavedChartsPanel';
import { ReportingMetric, ReportingMetricValue, ReportingCategory, SavedChart, CalculationFormula } from '@/types/reporting';
import { useSavedCharts, useCreateSavedChart, useDeleteSavedChart } from '@/hooks/useSavedCharts';
import { useExcelImport } from '@/hooks/useExcelImport';
import { useSyncGoogleAnalytics } from '@/hooks/useSyncGoogleAnalytics';
import { useSyncGoogleSearchConsole } from '@/hooks/useSyncGoogleSearchConsole';
import {
  useCreateMetric,
  useUpdateMetric,
  useDeleteMetric,
  useUpsertMetricValue,
  useCreateCalculatedMetric,
  useUpdateCalculatedMetric,
  useCalculatedMetricValues,
  useClearMetricValues,
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';

interface ReportingTableProps {
  category: ReportingCategory;
  metrics: ReportingMetric[];
  allMetrics?: ReportingMetric[]; // For cross-category visibility
  values: ReportingMetricValue[];
  categories?: ReportingCategory[];
  childCategories?: ReportingCategory[]; // For grouping in Overview
  isLoading?: boolean;
  onRefresh?: () => void;
  showCategoryGroups?: boolean; // Whether to group metrics by category
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
  const now = new Date();
  const isCurrentPeriod = (() => {
    switch (granularity) {
      case 'day':
        return date.toDateString() === now.toDateString();
      case 'week':
        return format(date, 'yyyy-ww') === format(now, 'yyyy-ww');
      case 'month':
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      case 'quarter':
        return date.getFullYear() === now.getFullYear() && 
          Math.ceil((date.getMonth() + 1) / 3) === Math.ceil((now.getMonth() + 1) / 3);
      case 'year':
        return date.getFullYear() === now.getFullYear();
      default:
        return false;
    }
  })();

  const suffix = isCurrentPeriod ? ' (Now)' : '';
  
  switch (granularity) {
    case 'day':
      return format(date, 'MMM d, yyyy') + suffix;
    case 'week':
      return `W${format(date, 'w yyyy')}` + suffix;
    case 'month':
      return format(date, 'MMM yyyy') + suffix;
    case 'quarter':
      return `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}` + suffix;
    case 'year':
      return format(date, 'yyyy') + suffix;
    default:
      return format(date, 'MMM yyyy') + suffix;
  }
};


export const ReportingTable: React.FC<ReportingTableProps> = ({
  category,
  metrics,
  allMetrics = [],
  values,
  categories = [],
  childCategories = [],
  isLoading,
  onRefresh,
  showCategoryGroups = false,
}) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formulaDialogOpen, setFormulaDialogOpen] = useState(false);
  const [editingCalculatedMetric, setEditingCalculatedMetric] = useState<ReportingMetric | null>(null);
  const [integrationDialogOpen, setIntegrationDialogOpen] = useState(false);
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<ReportingMetric | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [metricToDelete, setMetricToDelete] = useState<string | null>(null);
  const [clearDataDialogOpen, setClearDataDialogOpen] = useState(false);
  
  // Chart state
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>([]);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [showChart, setShowChart] = useState(false);
  const [saveChartDialogOpen, setSaveChartDialogOpen] = useState(false);
  
  // Date range - persist in localStorage
  const STORAGE_KEY = 'reporting-table-preferences';
  
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prefs = JSON.parse(stored);
        if (prefs.dateRange?.from && prefs.dateRange?.to) {
          return {
            from: new Date(prefs.dateRange.from),
            to: new Date(prefs.dateRange.to),
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load stored date range');
    }
    // Default: all time (Oct 2021 - end of current month)
    const now = new Date();
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      from: new Date(2021, 9, 1),
      to: endOfCurrentMonth,
    };
  });
  
  const [granularity, setGranularity] = useState<Granularity>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prefs = JSON.parse(stored);
        if (prefs.granularity) return prefs.granularity;
      }
    } catch (e) {}
    return 'month';
  });
  
  // Persist preferences to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        dateRange: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        },
        granularity,
      }));
    } catch (e) {
      console.warn('Failed to save preferences');
    }
  }, [dateRange, granularity]);

  const createMetric = useCreateMetric();
  const updateMetric = useUpdateMetric();
  const deleteMetric = useDeleteMetric();
  const upsertValue = useUpsertMetricValue();
  const createCalculatedMetric = useCreateCalculatedMetric();
  const updateCalculatedMetric = useUpdateCalculatedMetric();
  const excelImport = useExcelImport();
  const clearMetricValues = useClearMetricValues();
  const syncGA = useSyncGoogleAnalytics();
  const syncGSC = useSyncGoogleSearchConsole();
  
  // Check if any metrics have GA integration (by source name or integration_type)
  const hasGAMetrics = useMemo(() => 
    metrics.some(m => m.source === 'Google Analytics' || (m.integration_type === 'google_analytics' && m.integration_field)),
    [metrics]
  );
  
  // Check if any metrics have GSC integration (by source name)
  const hasGSCMetrics = useMemo(() => 
    metrics.some(m => m.source === 'Google Search Console'),
    [metrics]
  );
  
  // Check if any metrics have ANY integration (for "Sync This Month" button)
  const hasIntegratedMetrics = useMemo(() => 
    metrics.some(m => m.source === 'Google Analytics' || m.source === 'Google Search Console' || (m.integration_type && m.integration_field)),
    [metrics]
  );
  
  // Get calculated metric IDs and fetch their values
  const calculatedMetricIds = useMemo(() => 
    metrics.filter(m => m.is_calculated).map(m => m.id),
    [metrics]
  );
  
  const { data: calculatedValues } = useCalculatedMetricValues(
    calculatedMetricIds,
    format(dateRange.from, 'yyyy-MM-dd'),
    format(dateRange.to, 'yyyy-MM-dd')
  );
  
  // Saved charts
  const { data: savedCharts = [] } = useSavedCharts();
  const createSavedChart = useCreateSavedChart();
  const deleteSavedChart = useDeleteSavedChart();

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

  // Group metrics by category for Overview display
  const groupedMetrics = useMemo(() => {
    if (!showCategoryGroups || childCategories.length === 0) return null;
    
    const groups: { category: ReportingCategory; metrics: ReportingMetric[] }[] = [];
    childCategories.forEach(cat => {
      const categoryMetrics = metrics.filter(m => m.category_id === cat.id);
      if (categoryMetrics.length > 0) {
        groups.push({ category: cat, metrics: categoryMetrics });
      }
    });
    return groups;
  }, [showCategoryGroups, childCategories, metrics]);

  // Group values by metric and period (includes calculated values)
  const valuesByMetric = useMemo(() => {
    const grouped: Record<string, Record<string, ReportingMetricValue>> = {};
    
    // Add regular values
    values.forEach((v) => {
      if (!grouped[v.metric_id]) {
        grouped[v.metric_id] = {};
      }
      grouped[v.metric_id][v.period_date] = v;
    });
    
    // Add calculated values
    if (calculatedValues) {
      for (const [metricId, periodValues] of Object.entries(calculatedValues)) {
        if (!grouped[metricId]) {
          grouped[metricId] = {};
        }
        for (const [periodDate, value] of Object.entries(periodValues)) {
          // Only add if not already present (allow manual override)
          if (!grouped[metricId][periodDate]) {
            grouped[metricId][periodDate] = {
              id: `calculated-${metricId}-${periodDate}`,
              metric_id: metricId,
              period_date: periodDate,
              value,
              is_manual_override: false,
              created_at: '',
              updated_at: '',
              updated_by: null,
            };
          }
        }
      }
    }
    
    return grouped;
  }, [values, calculatedValues]);

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

  const handleClearData = () => {
    const metricIdsToClear = metrics.map(m => m.id);
    if (metricIdsToClear.length > 0) {
      clearMetricValues.mutate(metricIdsToClear, {
        onSuccess: () => {
          setClearDataDialogOpen(false);
          onRefresh?.();
        },
      });
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

  const handleEditFormula = (metric: ReportingMetric) => {
    setEditingCalculatedMetric(metric);
    setFormulaDialogOpen(true);
  };

  const handleFormulaDialogClose = (open: boolean) => {
    setFormulaDialogOpen(open);
    if (!open) {
      setEditingCalculatedMetric(null);
    }
  };

  const handleIntegrationConnect = (metricId: string, integrationType: string | null, integrationField?: string | null) => {
    updateMetric.mutate({
      id: metricId,
      integration_type: integrationType,
      integration_field: integrationField ?? null,
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

  const handleSaveChart = (name: string) => {
    createSavedChart.mutate({
      name,
      metric_ids: selectedMetricIds,
      chart_type: chartType,
      date_range_preset: 'all-time',
      custom_start_date: format(dateRange.from, 'yyyy-MM-dd'),
      custom_end_date: format(dateRange.to, 'yyyy-MM-dd'),
      granularity,
    }, {
      onSuccess: () => setSaveChartDialogOpen(false),
    });
  };

  const handleLoadSavedChart = (chart: SavedChart) => {
    setSelectedMetricIds(chart.metric_ids);
    setChartType(chart.chart_type);
    setGranularity(chart.granularity as Granularity);
    if (chart.custom_start_date && chart.custom_end_date) {
      setDateRange({
        from: new Date(chart.custom_start_date),
        to: new Date(chart.custom_end_date),
      });
    }
    setShowChart(true);
  };

  // Get all metrics for chart selection (includes child category metrics for Overview)
  const allAvailableMetrics = showCategoryGroups ? metrics : [...visibleMetrics.native, ...visibleMetrics.shared];
  const selectedChartMetrics = allAvailableMetrics.filter(m => selectedMetricIds.includes(m.id));
  const chartValues = values.filter(v => selectedMetricIds.includes(v.metric_id));

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
          <Button size="sm" variant="secondary" onClick={() => setFormulaDialogOpen(true)}>
            <Calculator className="h-4 w-4 mr-2" />
            Add Calculated
          </Button>
          <Button size="sm" variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          {hasGAMetrics && (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => syncGA.mutate({
                  startDate: format(dateRange.from, 'yyyy-MM-dd'),
                  endDate: format(dateRange.to, 'yyyy-MM-dd'),
                })}
                disabled={syncGA.isPending}
                className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
              >
                {syncGA.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CloudDownload className="h-4 w-4 mr-2" />
                )}
                Sync GA
              </Button>
            </>
          )}
          {hasGSCMetrics && (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => syncGSC.mutate({
                  startDate: format(dateRange.from, 'yyyy-MM-dd'),
                  endDate: format(dateRange.to, 'yyyy-MM-dd'),
                })}
                disabled={syncGSC.isPending}
                className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
              >
                {syncGSC.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CloudDownload className="h-4 w-4 mr-2" />
                )}
                Sync GSC
              </Button>
            </>
          )}
          <Button 
            size="sm" 
            variant="default"
            onClick={() => {
              const now = new Date();
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              // Sync all integrations for current month
              if (hasGAMetrics) {
                syncGA.mutate({
                  startDate: format(startOfMonth, 'yyyy-MM-dd'),
                  endDate: format(now, 'yyyy-MM-dd'),
                });
              }
              if (hasGSCMetrics) {
                syncGSC.mutate({
                  startDate: '2026-01-01',
                  endDate: format(now, 'yyyy-MM-dd'),
                });
              }
            }}
            disabled={syncGA.isPending || syncGSC.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {(syncGA.isPending || syncGSC.isPending) ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CloudDownload className="h-4 w-4 mr-2" />
            )}
            Sync This Month
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setClearDataDialogOpen(true)}
            disabled={metrics.length === 0}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Data
          </Button>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="flex items-center gap-3 flex-wrap p-3 bg-muted/30 rounded-lg">
        <KPISelector
          metrics={allAvailableMetrics}
          categories={childCategories.length > 0 ? childCategories : [category]}
          selectedMetricIds={selectedMetricIds}
          onSelectionChange={(ids) => {
            setSelectedMetricIds(ids);
            if (ids.length > 0) setShowChart(true);
          }}
          maxSelection={4}
        />
        <ToggleGroup type="single" value={chartType} onValueChange={(v) => v && setChartType(v as 'line' | 'bar')}>
          <ToggleGroupItem value="line" aria-label="Line chart">
            <LineChart className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="bar" aria-label="Bar chart">
            <BarChart3 className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        {selectedMetricIds.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setShowChart(!showChart)}>
            {showChart ? 'Hide Chart' : 'Show Chart'}
          </Button>
        )}
      </div>

      {/* Chart Display */}
      {showChart && selectedMetricIds.length > 0 && (
        <KPIChart
          metrics={selectedChartMetrics}
          values={chartValues}
          periods={periods}
          granularity={granularity}
          chartType={chartType}
          onClose={() => setShowChart(false)}
          onSave={() => setSaveChartDialogOpen(true)}
          title={`${category.name} - KPI Comparison`}
        />
      )}

      {/* Saved Charts */}
      <SavedChartsPanel
        charts={savedCharts}
        onSelect={handleLoadSavedChart}
        onDelete={(id) => deleteSavedChart.mutate(id)}
        isLoading={deleteSavedChart.isPending}
      />

      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="w-full">
          <div className="min-w-max">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="sticky left-0 bg-muted z-20 px-3 py-2 text-left text-sm font-semibold border-r border-border min-w-[250px]">
                    Metric
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
                {showCategoryGroups && groupedMetrics ? (
                  // Grouped display for Overview
                  groupedMetrics.length === 0 ? (
                    <tr>
                      <td 
                        colSpan={periods.length + 1} 
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No metrics defined yet. Add metrics in the subcategory tabs.
                      </td>
                    </tr>
                  ) : (
                    groupedMetrics.map(({ category: groupCategory, metrics: groupMetrics }) => (
                      <React.Fragment key={groupCategory.id}>
                        {/* Category group header */}
                        <tr className="bg-muted/30">
                          <td 
                            colSpan={periods.length + 1} 
                            className="px-3 py-2 text-sm font-semibold text-muted-foreground border-t border-border"
                          >
                            {groupCategory.name}
                          </td>
                        </tr>
                        {groupMetrics.map((metric) => (
                          <MetricRow
                            key={metric.id}
                            metric={metric}
                            values={valuesByMetric[metric.id] || {}}
                            periods={periods}
                            granularity={granularity}
                            dateRange={dateRange}
                            onValueChange={handleValueChange}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onEditFormula={handleEditFormula}
                            onConnectIntegration={handleConnectIntegration}
                            onShowInViews={handleShowInViews}
                            isFromOtherCategory={false}
                          />
                        ))}
                      </React.Fragment>
                    ))
                  )
                ) : (
                  // Standard display
                  visibleMetrics.native.length === 0 && visibleMetrics.shared.length === 0 ? (
                    <tr>
                      <td 
                        colSpan={periods.length + 1} 
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
                          granularity={granularity}
                          dateRange={dateRange}
                          onValueChange={handleValueChange}
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                          onEditFormula={handleEditFormula}
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
                          granularity={granularity}
                          dateRange={dateRange}
                          onValueChange={handleValueChange}
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                          onEditFormula={handleEditFormula}
                          onConnectIntegration={handleConnectIntegration}
                          isFromOtherCategory={true}
                        />
                      ))}
                    </>
                  )
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

      <FormulaBuilderDialog
        open={formulaDialogOpen}
        onOpenChange={handleFormulaDialogClose}
        onSubmit={(data) => {
          if (data.metricId) {
            // Edit mode
            updateCalculatedMetric.mutate({
              id: data.metricId,
              name: data.name,
              formula: data.formula,
            }, {
              onSuccess: () => handleFormulaDialogClose(false),
            });
          } else {
            // Create mode
            createCalculatedMetric.mutate({
              category_id: category.id,
              name: data.name,
              formula: data.formula,
            }, {
              onSuccess: () => handleFormulaDialogClose(false),
            });
          }
        }}
        metrics={metrics}
        isLoading={createCalculatedMetric.isPending || updateCalculatedMetric.isPending}
        categoryId={category.id}
        editingMetric={editingCalculatedMetric}
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

      <SaveChartDialog
        open={saveChartDialogOpen}
        onOpenChange={setSaveChartDialogOpen}
        onSave={handleSaveChart}
        isLoading={createSavedChart.isPending}
      />

      <ExcelImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        category={category}
        existingMetrics={metrics}
        onImport={async (data) => {
          await excelImport.mutateAsync(data);
        }}
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

      <AlertDialog open={clearDataDialogOpen} onOpenChange={setClearDataDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Data</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all values for {metrics.length} metrics in this category?
              This will remove all data points but keep the metric definitions.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearData} 
              className="bg-destructive text-destructive-foreground"
              disabled={clearMetricValues.isPending}
            >
              {clearMetricValues.isPending ? 'Clearing...' : 'Clear All Data'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
