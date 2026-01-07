import React from 'react';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ReportingMetric, ReportingCategory } from '@/types/reporting';

interface KPISelectorProps {
  metrics: ReportingMetric[];
  categories: ReportingCategory[];
  selectedMetricIds: string[];
  onSelectionChange: (metricIds: string[]) => void;
  maxSelection?: number;
}

export const KPISelector: React.FC<KPISelectorProps> = ({
  metrics,
  categories,
  selectedMetricIds,
  onSelectionChange,
  maxSelection = 4,
}) => {
  const selectedCount = selectedMetricIds.length;

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  const handleToggle = (metricId: string) => {
    if (selectedMetricIds.includes(metricId)) {
      onSelectionChange(selectedMetricIds.filter(id => id !== metricId));
    } else if (selectedMetricIds.length < maxSelection) {
      onSelectionChange([...selectedMetricIds, metricId]);
    }
  };

  const selectedMetrics = metrics.filter(m => selectedMetricIds.includes(m.id));

  // Group metrics by category
  const metricsByCategory = metrics.reduce((acc, metric) => {
    const categoryId = metric.category_id;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(metric);
    return acc;
  }, {} as Record<string, ReportingMetric[]>);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start min-w-[200px]">
          {selectedCount === 0 ? (
            <span className="text-muted-foreground">Select KPIs for chart...</span>
          ) : (
            <span>{selectedCount} KPI{selectedCount > 1 ? 's' : ''} selected</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="p-3 border-b">
          <p className="text-sm font-medium">Select up to {maxSelection} KPIs</p>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedCount} of {maxSelection} selected
          </p>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-2">
            {Object.entries(metricsByCategory).map(([categoryId, categoryMetrics]) => (
              <div key={categoryId} className="mb-3">
                <p className="text-xs font-semibold text-muted-foreground px-2 py-1">
                  {getCategoryName(categoryId)}
                </p>
                {categoryMetrics.map((metric) => {
                  const isSelected = selectedMetricIds.includes(metric.id);
                  const isDisabled = !isSelected && selectedCount >= maxSelection;
                  
                  return (
                    <button
                      key={metric.id}
                      onClick={() => handleToggle(metric.id)}
                      disabled={isDisabled}
                      className={cn(
                        "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors",
                        isSelected && "bg-primary/10 text-primary",
                        !isSelected && !isDisabled && "hover:bg-muted",
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <span className="truncate">{metric.name}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
        {selectedCount > 0 && (
          <div className="p-2 border-t">
            <div className="flex flex-wrap gap-1">
              {selectedMetrics.map((metric) => (
                <Badge
                  key={metric.id}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleToggle(metric.id)}
                >
                  {metric.name}
                  <span className="ml-1 text-muted-foreground">×</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};