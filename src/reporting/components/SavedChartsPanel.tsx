import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, LineChart, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { SavedChart } from '@/types/reporting';

interface SavedChartsPanelProps {
  charts: SavedChart[];
  onSelect: (chart: SavedChart) => void;
  onDelete: (chartId: string) => void;
  isLoading?: boolean;
}

export const SavedChartsPanel: React.FC<SavedChartsPanelProps> = ({
  charts,
  onSelect,
  onDelete,
  isLoading,
}) => {
  if (charts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Saved Charts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {charts.map((chart) => (
          <div
            key={chart.id}
            className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => onSelect(chart)}
          >
            <div className="flex items-center gap-2">
              {chart.chart_type === 'bar' ? (
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <LineChart className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">{chart.name}</p>
                <p className="text-xs text-muted-foreground">
                  {chart.metric_ids.length} metrics • {format(new Date(chart.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(chart.id);
              }}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};