import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Trash2, MoreVertical, Link, Edit2, Check, X, Eye, Calculator } from 'lucide-react';
import { ReportingMetric, ReportingMetricValue, INTEGRATION_LABELS, IntegrationType } from '@/types/reporting';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export type Granularity = 'day' | 'week' | 'month' | 'quarter' | 'year';

interface DateRange {
  from: Date;
  to: Date;
}

// Aggregate values for grouped periods (sum monthly values for quarter/year)
const aggregateValue = (
  values: Record<string, ReportingMetricValue>,
  periodStart: string,
  granularity: Granularity,
  dateRange: DateRange
): number | null => {
  // For month or smaller granularity, just return the period value
  if (granularity === 'month' || granularity === 'week' || granularity === 'day') {
    const periodValue = values[periodStart];
    if (periodValue?.value !== null && periodValue?.value !== undefined) {
      return periodValue.value;
    }
    return null;
  }
  
  // For quarter and year, sum up all monthly values within the period
  const startDate = new Date(periodStart);
  let monthsToSum: string[] = [];
  
  if (granularity === 'quarter') {
    // Sum 3 months
    for (let i = 0; i < 3; i++) {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      if (monthDate <= dateRange.to) {
        monthsToSum.push(format(monthDate, 'yyyy-MM-01'));
      }
    }
  } else if (granularity === 'year') {
    // Sum 12 months
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(startDate.getFullYear(), i, 1);
      if (monthDate >= dateRange.from && monthDate <= dateRange.to) {
        monthsToSum.push(format(monthDate, 'yyyy-MM-01'));
      }
    }
  }
  
  let sum = 0;
  let hasAnyValue = false;
  
  for (const monthKey of monthsToSum) {
    const value = values[monthKey];
    if (value?.value !== null && value?.value !== undefined) {
      sum += value.value;
      hasAnyValue = true;
    }
  }
  
  return hasAnyValue ? sum : null;
};

interface MetricRowProps {
  metric: ReportingMetric;
  values: Record<string, ReportingMetricValue>;
  periods: string[];
  granularity: Granularity;
  dateRange: DateRange;
  onValueChange: (metricId: string, periodDate: string, value: number | null) => void;
  onDelete: (metricId: string) => void;
  onEdit: (metric: ReportingMetric) => void;
  onEditFormula?: (metric: ReportingMetric) => void;
  onConnectIntegration: (metric: ReportingMetric) => void;
  onShowInViews?: (metric: ReportingMetric) => void;
  isFromOtherCategory?: boolean;
}

export const MetricRow: React.FC<MetricRowProps> = ({
  metric,
  values,
  periods,
  granularity,
  dateRange,
  onValueChange,
  onDelete,
  onEdit,
  onEditFormula,
  onConnectIntegration,
  onShowInViews,
  isFromOtherCategory = false,
}) => {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const formatValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    if (metric.name.toLowerCase().includes('rate') || metric.name.toLowerCase().includes('%')) {
      return `${value.toFixed(2)}%`;
    }
    if (metric.name.toLowerCase().includes('revenue') || metric.name.toLowerCase().includes('cost')) {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return new Intl.NumberFormat('en-US').format(value);
  };

  const handleCellClick = (periodDate: string, currentValue: number | null | undefined) => {
    setEditingCell(periodDate);
    setEditValue(currentValue?.toString() ?? '');
  };

  const handleSave = (periodDate: string) => {
    const numValue = editValue === '' ? null : parseFloat(editValue);
    onValueChange(metric.id, periodDate, numValue);
    setEditingCell(null);
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, periodDate: string) => {
    if (e.key === 'Enter') {
      handleSave(periodDate);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <tr className={cn(
      "border-b border-border hover:bg-muted/50",
      isFromOtherCategory && "bg-muted/20"
    )}>
      <td className="sticky left-0 bg-background z-10 px-3 py-2 font-medium text-sm border-r border-border min-w-[250px]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="flex items-center gap-1">
              {metric.is_calculated && (
                <Tooltip>
                  <TooltipTrigger>
                    <Calculator className="h-3 w-3 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>Calculated metric</TooltipContent>
                </Tooltip>
              )}
              {metric.name}
              {isFromOtherCategory && (
                <Tooltip>
                  <TooltipTrigger>
                    <Eye className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>Shared from another view</TooltipContent>
                </Tooltip>
              )}
            </span>
            {(metric.source || metric.integration_type) && (
              <span className="text-xs text-muted-foreground">
                {metric.source || INTEGRATION_LABELS[metric.integration_type as IntegrationType] || metric.integration_type}
              </span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {metric.is_calculated && onEditFormula ? (
                <DropdownMenuItem onClick={() => onEditFormula(metric)}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Edit Formula
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onEdit(metric)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Metric
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onConnectIntegration(metric)}>
                <Link className="h-4 w-4 mr-2" />
                Connect Integration
              </DropdownMenuItem>
              {onShowInViews && (
                <DropdownMenuItem onClick={() => onShowInViews(metric)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Show in Other Views
                </DropdownMenuItem>
              )}
              {!isFromOtherCategory && (
                <DropdownMenuItem 
                  onClick={() => onDelete(metric.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
      {periods.map((period) => {
        // Use aggregated value for quarter/year granularity
        const aggregatedValue = aggregateValue(values, period, granularity, dateRange);
        const valueRecord = values[period];
        const isEditing = editingCell === period;
        const isOverride = valueRecord?.is_manual_override;

        return (
          <td 
            key={period}
            className={cn(
              "px-2 py-1 text-sm text-right min-w-[100px] border-r border-border",
              !metric.is_calculated && granularity === 'month' && "cursor-pointer hover:bg-muted",
              isOverride && granularity === 'month' && "bg-blue-50 dark:bg-blue-950",
              metric.is_calculated && "bg-primary/5",
              (granularity === 'quarter' || granularity === 'year') && "bg-muted/30"
            )}
            onClick={() => !isEditing && !metric.is_calculated && granularity === 'month' && handleCellClick(period, aggregatedValue)}
          >
            {isEditing ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, period)}
                  className="h-7 text-right text-sm"
                  autoFocus
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => { e.stopPropagation(); handleSave(period); }}
                >
                  <Check className="h-3 w-3 text-green-600" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                >
                  <X className="h-3 w-3 text-red-600" />
                </Button>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn(isOverride && granularity === 'month' && "text-blue-600 font-medium")}>
                    {formatValue(aggregatedValue)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {granularity === 'month' ? (
                    <>
                      <p>Click to edit</p>
                      {isOverride && <p className="text-xs text-muted-foreground">Manually entered</p>}
                    </>
                  ) : (
                    <p>Sum of monthly values</p>
                  )}
                </TooltipContent>
              </Tooltip>
            )}
          </td>
        );
      })}
    </tr>
  );
};
