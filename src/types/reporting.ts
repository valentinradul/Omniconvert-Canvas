export interface ReportingCategory {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ReportingMetric {
  id: string;
  company_id: string;
  category_id: string;
  name: string;
  source: string | null;
  integration_type: string | null;
  integration_field: string | null;
  is_calculated: boolean;
  calculation_formula: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  visible_in_categories: string[];
}

export interface ReportingMetricValue {
  id: string;
  metric_id: string;
  period_date: string;
  value: number | null;
  is_manual_override: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface MetricWithValues extends ReportingMetric {
  values: Record<string, ReportingMetricValue>;
}

export type IntegrationType = 
  | 'google_analytics'
  | 'google_search_console'
  | 'hubspot'
  | 'google_ads'
  | 'linkedin_ads'
  | 'meta_ads'
  | 'manual';

export const INTEGRATION_LABELS: Record<IntegrationType, string> = {
  google_analytics: 'Google Analytics',
  google_search_console: 'Google Search Console',
  hubspot: 'Hubspot',
  google_ads: 'Google Ads',
  linkedin_ads: 'LinkedIn Ads',
  meta_ads: 'Meta Ads',
  manual: 'Manual Entry',
};

export const DEFAULT_CATEGORIES = [
  { name: 'Marketing Performance', slug: 'marketing-performance', parent_slug: null, sort_order: 0 },
  { name: 'Organic Performance', slug: 'organic-performance', parent_slug: 'marketing-performance', sort_order: 0 },
  { name: 'Paid Performance', slug: 'paid-performance', parent_slug: 'marketing-performance', sort_order: 1 },
  { name: 'Social Performance', slug: 'social-performance', parent_slug: 'marketing-performance', sort_order: 2 },
  { name: 'Sales Performance', slug: 'sales-performance', parent_slug: null, sort_order: 1 },
  { name: 'Activity', slug: 'sales-activity', parent_slug: 'sales-performance', sort_order: 0 },
  { name: 'Outcome', slug: 'sales-outcome', parent_slug: 'sales-performance', sort_order: 1 },
];
