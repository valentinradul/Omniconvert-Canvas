// GTM Calculator Types

export interface OutreachCampaign {
  id: string;
  user_id?: string;
  company_id?: string;
  name: string;
  created_at: string;

  // Timeline
  start_date?: string;
  end_date?: string;
  status?: 'Draft' | 'Scheduled' | 'Running' | 'Paused' | 'Completed';
  notes?: string;
  tags?: string[];

  // Channel Config
  email_enabled: boolean;
  linkedin_enabled: boolean;

  // Targeting
  targeted_companies: number;
  contacts_per_company: number;
  emails_per_contact: number;
  campaign_duration: number;
  follow_up_interval: number;

  // Funnel Rates
  meeting_rate: number;
  opportunity_conversion_rate?: number;
  closing_rate?: number;
  revenue_per_customer?: number;

  // Costs
  email_agency_cost?: number;
  email_internal_cost?: number;
  email_tech_cost?: number;
  linkedin_agency_cost?: number;
  linkedin_internal_cost?: number;
  linkedin_tech_cost?: number;

  // Calculated
  total_contacts: number;
  total_cost: number;
  revenue: number;
  roi: number;
  customers: number;

  // Actuals
  actual_emails_sent?: number;
  actual_meetings_booked?: number;
  actual_opportunities?: number;
  actual_deals?: number;
  actual_revenue?: number;
  actual_cost?: number;
}

export interface AdCampaign {
  id: string;
  user_id?: string;
  company_id?: string;
  name: string;
  created_at: string;
  type: 'ad';

  // Timeline
  start_date?: string;
  end_date?: string;
  status?: 'Draft' | 'Scheduled' | 'Running' | 'Paused' | 'Completed';
  notes?: string;
  tags?: string[];

  // Channel
  channel: string;

  // Costs
  agency_cost: number;
  creative_cost: number;
  media_cost: number;

  // Funnel
  cpc: number;
  target_cost_per_signup?: number;
  conversion_rate?: number;
  signup_to_customer_rate: number;
  revenue_per_customer: number;
  transactions_per_customer: number;

  // Calculated
  clicks: number;
  signups: number;
  total_cost: number;
  cost_per_signup: number;
  paid_customers: number;
  cac: number;
  captured_revenue: number;
  total_revenue: number;
  roas: number;

  // Actuals
  actual_agency_cost?: number;
  actual_creative_cost?: number;
  actual_media_cost?: number;
  actual_clicks?: number;
  actual_signups?: number;
  actual_paid_customers?: number;
  actual_revenue?: number;
}

export type Campaign = OutreachCampaign | AdCampaign;

export interface AdChannel {
  id: string;
  name: string;
  enabled: boolean;
  agencyCost: number;
  creativeCost: number;
  mediaCost: number;
  cpc: number;
  targetCostPerSignup: number;
  signupToCustomerRate: number;
  revenuePerCustomer: number;
  transactionsPerCustomer: number;
}

// Utility functions
export const formatCurrencyEUR = (value: number): string => {
  return `€${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)}`;
};

export const formatNumber = (value: number, decimals = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};
