export interface ExperimentFinancial {
  id: string;
  experiment_id: string;
  type: 'cost' | 'revenue';
  name: string;
  amount: number;
  period_start: string;
  period_end: string;
  description?: string;
  added_by: string;
  created_at: string;
  updated_at: string;
}