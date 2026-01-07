import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportingTable } from '../components/ReportingTable';
import {
  useReportingCategories,
  useInitializeReportingCategories,
  useReportingMetrics,
  useReportingMetricValues,
} from '@/hooks/useReporting';
import { useCompany } from '@/context/company/CompanyContext';
import { Users, Activity, Target } from 'lucide-react';

const SalesPerformance: React.FC = () => {
  const { currentCompany } = useCompany();
  const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useReportingCategories();
  const initializeCategories = useInitializeReportingCategories();
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useReportingMetrics();

  // Get all metric IDs for fetching values
  const metricIds = metrics?.map(m => m.id) || [];
  const { data: values, isLoading: valuesLoading, refetch: refetchValues } = useReportingMetricValues(metricIds);

  // Initialize categories if none exist
  useEffect(() => {
    if (!categoriesLoading && categories && categories.length === 0 && currentCompany?.id) {
      initializeCategories.mutate();
    }
  }, [categoriesLoading, categories, currentCompany?.id]);

  const handleRefresh = () => {
    refetchCategories();
    refetchMetrics();
    refetchValues();
  };

  if (categoriesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Find the sales performance categories
  const salesParent = categories?.find(c => c.slug === 'sales-performance');
  const activityCategory = categories?.find(c => c.slug === 'sales-activity');
  const outcomeCategory = categories?.find(c => c.slug === 'sales-outcome');

  const getMetricsForCategory = (categoryId: string) => 
    metrics?.filter(m => m.category_id === categoryId) || [];

  const isLoading = categoriesLoading || metricsLoading || valuesLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Sales Performance
        </h1>
        <p className="text-muted-foreground mt-1">
          Track sales activities and outcomes
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="outcome" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Outcome
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>
                High-level sales metrics and KPIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {salesParent ? (
                <ReportingTable
                  category={salesParent}
                  metrics={getMetricsForCategory(salesParent.id)}
                  values={values || []}
                  isLoading={isLoading}
                  onRefresh={handleRefresh}
                />
              ) : (
                <p className="text-muted-foreground">Loading categories...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Sales Activity</CardTitle>
              <CardDescription>
                Track calls, meetings, demos, and other sales activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityCategory ? (
                <ReportingTable
                  category={activityCategory}
                  metrics={getMetricsForCategory(activityCategory.id)}
                  values={values || []}
                  isLoading={isLoading}
                  onRefresh={handleRefresh}
                />
              ) : (
                <p className="text-muted-foreground">Loading categories...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcome">
          <Card>
            <CardHeader>
              <CardTitle>Sales Outcomes</CardTitle>
              <CardDescription>
                Revenue, deals closed, and conversion metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {outcomeCategory ? (
                <ReportingTable
                  category={outcomeCategory}
                  metrics={getMetricsForCategory(outcomeCategory.id)}
                  values={values || []}
                  isLoading={isLoading}
                  onRefresh={handleRefresh}
                />
              ) : (
                <p className="text-muted-foreground">Loading categories...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesPerformance;
