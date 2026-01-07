import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, RefreshCw } from 'lucide-react';
import { MetricRow } from './MetricRow';
import { AddMetricDialog } from './AddMetricDialog';
import { IntegrationDialog } from './IntegrationDialog';
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
  values: ReportingMetricValue[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

// Generate periods from Jan 2024 to Dec 2025
const generatePeriods = (): string[] => {
  const periods: string[] = [];
  for (let year = 2024; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      periods.push(`${year}-${month.toString().padStart(2, '0')}-01`);
    }
  }
  return periods;
};

const formatPeriodHeader = (period: string): string => {
  const date = new Date(period);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const ReportingTable: React.FC<ReportingTableProps> = ({
  category,
  metrics,
  values,
  isLoading,
  onRefresh,
}) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [integrationDialogOpen, setIntegrationDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<ReportingMetric | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [metricToDelete, setMetricToDelete] = useState<string | null>(null);

  const createMetric = useCreateMetric();
  const updateMetric = useUpdateMetric();
  const deleteMetric = useDeleteMetric();
  const upsertValue = useUpsertMetricValue();

  const periods = useMemo(() => generatePeriods(), []);

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
    // For now, just open the integration dialog
    setSelectedMetric(metric);
    setIntegrationDialogOpen(true);
  };

  const handleConnectIntegration = (metric: ReportingMetric) => {
    setSelectedMetric(metric);
    setIntegrationDialogOpen(true);
  };

  const handleIntegrationConnect = (metricId: string, integrationType: string | null) => {
    updateMetric.mutate({
      id: metricId,
      integration_type: integrationType,
    }, {
      onSuccess: () => setIntegrationDialogOpen(false),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{category.name}</h3>
        <div className="flex items-center gap-2">
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
                      {formatPeriodHeader(period)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={periods.length + 2} 
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No metrics defined yet. Click "Add Metric" to get started.
                    </td>
                  </tr>
                ) : (
                  metrics.map((metric) => (
                    <MetricRow
                      key={metric.id}
                      metric={metric}
                      values={valuesByMetric[metric.id] || {}}
                      periods={periods}
                      onValueChange={handleValueChange}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      onConnectIntegration={handleConnectIntegration}
                    />
                  ))
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
