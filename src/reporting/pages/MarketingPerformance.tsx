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
import { BarChart3, TrendingUp, Globe, Share2, DollarSign } from 'lucide-react';

const MarketingPerformance: React.FC = () => {
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

  // Find marketing-related categories
  const marketingParent = categories?.find(c => c.slug === 'marketing-performance');
  const organicCategory = categories?.find(c => c.slug === 'organic-performance');
  const paidCategory = categories?.find(c => c.slug === 'paid-performance');
  const socialCategory = categories?.find(c => c.slug === 'social-performance');

  // All marketing categories for visibility selector
  const marketingCategories = categories?.filter(c => 
    c.slug === 'marketing-performance' ||
    c.slug === 'organic-performance' ||
    c.slug === 'paid-performance' ||
    c.slug === 'social-performance'
  ) || [];

  const getMetricsForCategory = (categoryId: string) => 
    metrics?.filter(m => m.category_id === categoryId) || [];

  const isLoading = categoriesLoading || metricsLoading || valuesLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Marketing Performance
        </h1>
        <p className="text-muted-foreground mt-1">
          Track and analyze your marketing metrics across all channels
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="organic" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Organic
          </TabsTrigger>
          <TabsTrigger value="paid" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Paid
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Social
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Overview</CardTitle>
              <CardDescription>
                High-level marketing metrics combining all channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {marketingParent ? (
                <ReportingTable
                  category={marketingParent}
                  metrics={getMetricsForCategory(marketingParent.id)}
                  allMetrics={metrics || []}
                  values={values || []}
                  categories={marketingCategories}
                  isLoading={isLoading}
                  onRefresh={handleRefresh}
                />
              ) : (
                <p className="text-muted-foreground">Loading categories...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organic">
          <Card>
            <CardHeader>
              <CardTitle>Organic Performance</CardTitle>
              <CardDescription>
                SEO, organic search, and content marketing metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {organicCategory ? (
                <ReportingTable
                  category={organicCategory}
                  metrics={getMetricsForCategory(organicCategory.id)}
                  allMetrics={metrics || []}
                  values={values || []}
                  categories={marketingCategories}
                  isLoading={isLoading}
                  onRefresh={handleRefresh}
                />
              ) : (
                <p className="text-muted-foreground">Loading categories...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid">
          <Card>
            <CardHeader>
              <CardTitle>Paid Performance</CardTitle>
              <CardDescription>
                Google Ads, LinkedIn Ads, Meta Ads, and other paid channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paidCategory ? (
                <ReportingTable
                  category={paidCategory}
                  metrics={getMetricsForCategory(paidCategory.id)}
                  allMetrics={metrics || []}
                  values={values || []}
                  categories={marketingCategories}
                  isLoading={isLoading}
                  onRefresh={handleRefresh}
                />
              ) : (
                <p className="text-muted-foreground">Loading categories...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Performance</CardTitle>
              <CardDescription>
                Social media engagement and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {socialCategory ? (
                <ReportingTable
                  category={socialCategory}
                  metrics={getMetricsForCategory(socialCategory.id)}
                  allMetrics={metrics || []}
                  values={values || []}
                  categories={marketingCategories}
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

export default MarketingPerformance;
