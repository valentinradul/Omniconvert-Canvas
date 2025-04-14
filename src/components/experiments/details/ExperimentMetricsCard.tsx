
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ExperimentMetricsCardProps {
  totalCost?: number;
  totalReturn?: number;
}

const ExperimentMetricsCard: React.FC<ExperimentMetricsCardProps> = ({ 
  totalCost, 
  totalReturn 
}) => {
  const calculateROI = () => {
    if (totalCost === undefined || totalReturn === undefined || totalCost === 0) {
      return null;
    }
    return ((totalReturn - totalCost) / totalCost * 100).toFixed(2);
  };

  const roi = calculateROI();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Total Cost</h3>
            <p className="text-2xl font-semibold">
              {totalCost !== undefined ? `$${totalCost.toFixed(2)}` : '—'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Total Return</h3>
            <p className="text-2xl font-semibold">
              {totalReturn !== undefined ? `$${totalReturn.toFixed(2)}` : '—'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">ROI</h3>
            <p className="text-2xl font-semibold">
              {roi ? `${roi}%` : '—'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExperimentMetricsCard;
