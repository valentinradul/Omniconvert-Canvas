import React, { useState, useEffect } from 'react';
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
import { Trash2, MoreVertical, Link, Edit2, Check, X } from 'lucide-react';
import { ReportingMetric, ReportingMetricValue, INTEGRATION_LABELS, IntegrationType } from '@/types/reporting';
import { cn } from '@/lib/utils';

interface MetricRowProps {
  metric: ReportingMetric;
  values: Record<string, ReportingMetricValue>;
  periods: string[];
  onValueChange: (metricId: string, periodDate: string, value: number | null) => void;
  onDelete: (metricId: string) => void;
  onEdit: (metric: ReportingMetric) => void;
  onConnectIntegration: (metric: ReportingMetric) => void;
}

export const MetricRow: React.FC<MetricRowProps> = ({
  metric,
  values,
  periods,
  onValueChange,
  onDelete,
  onEdit,
  onConnectIntegration,
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
    <tr className="border-b border-border hover:bg-muted/50">
      <td className="sticky left-0 bg-background z-10 px-3 py-2 font-medium text-sm border-r border-border min-w-[200px]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span>{metric.name}</span>
            {metric.source && (
              <span className="text-xs text-muted-foreground">{metric.source}</span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(metric)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Metric
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onConnectIntegration(metric)}>
                <Link className="h-4 w-4 mr-2" />
                Connect Integration
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(metric.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
      <td className="sticky left-[200px] bg-background z-10 px-3 py-2 text-sm text-muted-foreground border-r border-border min-w-[120px]">
        {metric.integration_type 
          ? INTEGRATION_LABELS[metric.integration_type as IntegrationType] || metric.source
          : metric.source || 'Manual'}
      </td>
      {periods.map((period) => {
        const valueRecord = values[period];
        const value = valueRecord?.value;
        const isEditing = editingCell === period;
        const isOverride = valueRecord?.is_manual_override;

        return (
          <td 
            key={period}
            className={cn(
              "px-2 py-1 text-sm text-right min-w-[100px] border-r border-border cursor-pointer hover:bg-muted",
              isOverride && "bg-blue-50 dark:bg-blue-950"
            )}
            onClick={() => !isEditing && handleCellClick(period, value)}
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
                  <span className={cn(isOverride && "text-blue-600 font-medium")}>
                    {formatValue(value)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to edit</p>
                  {isOverride && <p className="text-xs text-muted-foreground">Manually entered</p>}
                </TooltipContent>
              </Tooltip>
            )}
          </td>
        );
      })}
    </tr>
  );
};
