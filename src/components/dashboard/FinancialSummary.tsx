import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/company/CompanyContext';
import { TimePeriod } from './PeriodSelector';
import { getPeriodDateRange } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

interface FinancialSummaryProps {
  selectedPeriod: TimePeriod;
}

interface FinancialSummary {
  totalCosts: number;
  totalRevenues: number;
  netResult: number;
  experimentCount: number;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ selectedPeriod }) => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const [summary, setSummary] = useState<FinancialSummary>({
    totalCosts: 0,
    totalRevenues: 0,
    netResult: 0,
    experimentCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchFinancialSummary = async () => {
    try {
      const { start, end } = getPeriodDateRange(selectedPeriod);
      
      // Build query for experiments in the selected period
      let experimentsQuery = supabase
        .from('experiments')
        .select(`
          id,
          startdate,
          company_id,
          userid
        `);

      // Add company filter if user is in a company
      if (currentCompany?.id) {
        experimentsQuery = experimentsQuery.eq('company_id', currentCompany.id);
      } else {
        experimentsQuery = experimentsQuery.eq('userid', user?.id);
      }

      // Add period filter for all-time vs specific periods
      if (selectedPeriod !== 'all-time') {
        experimentsQuery = experimentsQuery
          .gte('startdate', start.toISOString())
          .lte('startdate', end.toISOString());
      }

      const { data: experiments, error } = await experimentsQuery;

      if (error) throw error;

      // Now fetch financial data for these experiments
      const experimentIds = experiments?.map(e => e.id) || [];
      
      if (experimentIds.length === 0) {
        setSummary({
          totalCosts: 0,
          totalRevenues: 0,
          netResult: 0,
          experimentCount: 0
        });
        return;
      }

      const { data: financials, error: financialsError } = await supabase
        .from('experiment_financials')
        .select('*')
        .in('experiment_id', experimentIds);

      if (financialsError) throw financialsError;

      // Calculate totals from financial entries that overlap with the selected period
      let totalCosts = 0;
      let totalRevenues = 0;
      const experimentSet = new Set();

      financials?.forEach(financial => {
        // Check if financial period overlaps with selected period
        const financialStart = new Date(financial.period_start);
        const financialEnd = new Date(financial.period_end);
        
        if (selectedPeriod === 'all-time' || 
            (financialStart <= end && financialEnd >= start)) {
          experimentSet.add(financial.experiment_id);
          
          if (financial.type === 'cost') {
            totalCosts += financial.amount;
          } else if (financial.type === 'revenue') {
            totalRevenues += financial.amount;
          }
        }
      });

      setSummary({
        totalCosts,
        totalRevenues,
        netResult: totalRevenues - totalCosts,
        experimentCount: experimentSet.size
      });
    } catch (error) {
      console.error('Error fetching financial summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialSummary();
  }, [selectedPeriod, currentCompany?.id, user?.id]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading financial summary...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Summary - {selectedPeriod.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm font-medium text-red-600">Total Costs</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              ${summary.totalCosts.toFixed(2)}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-green-600">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              ${summary.totalRevenues.toFixed(2)}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium">Net Result</span>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              summary.netResult >= 0 ? "text-green-600" : "text-red-600"
            )}>
              ${summary.netResult.toFixed(2)}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">Experiments</span>
            </div>
            <p className="text-2xl font-bold text-muted-foreground">
              {summary.experimentCount}
            </p>
            <p className="text-xs text-muted-foreground">with financial data</p>
          </div>
        </div>

        {summary.experimentCount > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Avg Cost per Experiment:</span>
                <span className="ml-2">${(summary.totalCosts / summary.experimentCount).toFixed(2)}</span>
              </div>
              <div>
                <span className="font-medium">Avg Revenue per Experiment:</span>
                <span className="ml-2">${(summary.totalRevenues / summary.experimentCount).toFixed(2)}</span>
              </div>
              <div>
                <span className="font-medium">ROI:</span>
                <span className={cn(
                  "ml-2 font-medium",
                  summary.totalCosts > 0 
                    ? (summary.totalRevenues / summary.totalCosts >= 1 ? "text-green-600" : "text-red-600")
                    : "text-muted-foreground"
                )}>
                  {summary.totalCosts > 0 
                    ? `${((summary.totalRevenues / summary.totalCosts - 1) * 100).toFixed(1)}%`
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialSummary;