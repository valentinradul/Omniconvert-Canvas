import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Calculator, ArrowDown, Minus, Plus, TrendingUp, BarChart2, CalendarDays, Percent } from 'lucide-react';
import { 
  ReportingMetric, 
  CalculationFormula, 
  CalculationFormulaType, 
  CALCULATION_TYPE_LABELS,
} from '@/types/reporting';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/context/company/CompanyContext';
import { format, subMonths } from 'date-fns';

interface FormulaBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    formula: CalculationFormula;
    metricId?: string; // For edit mode
  }) => void;
  metrics: ReportingMetric[];
  isLoading?: boolean;
  categoryId: string;
  editingMetric?: ReportingMetric | null; // The metric being edited
}

const FORMULA_TYPE_ICONS: Record<CalculationFormulaType, React.ReactNode> = {
  division: <ArrowDown className="h-4 w-4 rotate-0" />,
  multiplication: <span className="text-sm font-bold">×</span>,
  sum: <Plus className="h-4 w-4" />,
  difference: <Minus className="h-4 w-4" />,
  cumulative: <BarChart2 className="h-4 w-4" />,
  rolling_average: <TrendingUp className="h-4 w-4" />,
  year_to_date: <CalendarDays className="h-4 w-4" />,
  percentage_change: <Percent className="h-4 w-4" />,
};

export const FormulaBuilderDialog: React.FC<FormulaBuilderDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  metrics,
  isLoading,
  categoryId,
  editingMetric,
}) => {
  const { currentCompany } = useCompany();
  const [name, setName] = useState('');
  const [formulaType, setFormulaType] = useState<CalculationFormulaType>('division');
  const [numeratorId, setNumeratorId] = useState('');
  const [denominatorId, setDenominatorId] = useState('');
  const [sourceMetricId, setSourceMetricId] = useState('');
  const [sumMetricIds, setSumMetricIds] = useState<string[]>([]);
  const [rollingPeriods, setRollingPeriods] = useState(3);
  const [outputFormat, setOutputFormat] = useState<'number' | 'percentage' | 'currency'>('number');
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [multiplyBy100, setMultiplyBy100] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, number | null>>({});
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const isEditMode = !!editingMetric;

  // Populate form when editing an existing metric
  useEffect(() => {
    if (editingMetric && open) {
      setName(editingMetric.name);
      
      if (editingMetric.calculation_formula) {
        try {
          const formula = typeof editingMetric.calculation_formula === 'string'
            ? JSON.parse(editingMetric.calculation_formula) as CalculationFormula
            : editingMetric.calculation_formula as CalculationFormula;
          
          setFormulaType(formula.type);
          setOutputFormat(formula.format || 'number');
          setDecimalPlaces(formula.decimalPlaces ?? 2);
          setMultiplyBy100(formula.multiplyBy100 || false);
          
          if (formula.operands) {
            if (formula.operands.numerator) setNumeratorId(formula.operands.numerator);
            if (formula.operands.denominator) setDenominatorId(formula.operands.denominator);
            if (formula.operands.metricIds) setSumMetricIds(formula.operands.metricIds);
          }
          
          if (formula.sourceMetricId) setSourceMetricId(formula.sourceMetricId);
          if (formula.rollingPeriods) setRollingPeriods(formula.rollingPeriods);
        } catch (e) {
          console.error('Failed to parse formula:', e);
        }
      }
    }
  }, [editingMetric, open]);

  // Non-calculated metrics only
  const availableMetrics = useMemo(() => 
    metrics.filter(m => !m.is_calculated),
    [metrics]
  );

  // Generate preview periods (last 3 months)
  const previewPeriods = useMemo(() => {
    const now = new Date();
    return [
      format(subMonths(now, 2), 'yyyy-MM-01'),
      format(subMonths(now, 1), 'yyyy-MM-01'),
      format(now, 'yyyy-MM-01'),
    ];
  }, []);

  // Build formula from current state
  const currentFormula = useMemo((): CalculationFormula | null => {
    const base: Partial<CalculationFormula> = {
      type: formulaType,
      format: outputFormat,
      decimalPlaces,
      multiplyBy100: formulaType === 'division' && multiplyBy100,
    };

    switch (formulaType) {
      case 'division':
      case 'multiplication':
      case 'difference':
        if (!numeratorId || !denominatorId) return null;
        return {
          ...base,
          type: formulaType,
          operands: { numerator: numeratorId, denominator: denominatorId },
        } as CalculationFormula;

      case 'sum':
        if (sumMetricIds.length < 2) return null;
        return {
          ...base,
          type: formulaType,
          operands: { metricIds: sumMetricIds },
        } as CalculationFormula;

      case 'cumulative':
      case 'year_to_date':
      case 'percentage_change':
        if (!sourceMetricId) return null;
        return {
          ...base,
          type: formulaType,
          sourceMetricId,
        } as CalculationFormula;

      case 'rolling_average':
        if (!sourceMetricId || rollingPeriods < 2) return null;
        return {
          ...base,
          type: formulaType,
          sourceMetricId,
          rollingPeriods,
        } as CalculationFormula;

      default:
        return null;
    }
  }, [formulaType, numeratorId, denominatorId, sourceMetricId, sumMetricIds, rollingPeriods, outputFormat, decimalPlaces, multiplyBy100]);

  // Fetch preview when formula changes
  useEffect(() => {
    if (!open || !currentFormula || !currentCompany?.id) {
      setPreviewValues({});
      return;
    }

    const fetchPreview = async () => {
      setIsLoadingPreview(true);
      try {
        const { data, error } = await supabase.functions.invoke('calculate-metrics', {
          body: {
            action: 'preview',
            companyId: currentCompany.id,
            formula: currentFormula,
            previewPeriods,
          },
        });

        if (error) throw error;
        setPreviewValues(data.results || {});
      } catch (error) {
        console.error('Error fetching preview:', error);
        setPreviewValues({});
      } finally {
        setIsLoadingPreview(false);
      }
    };

    const debounceTimer = setTimeout(fetchPreview, 500);
    return () => clearTimeout(debounceTimer);
  }, [open, currentFormula, currentCompany?.id, previewPeriods]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFormula || !name.trim()) return;

    onSubmit({ 
      name: name.trim(), 
      formula: currentFormula,
      metricId: editingMetric?.id, 
    });
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setFormulaType('division');
    setNumeratorId('');
    setDenominatorId('');
    setSourceMetricId('');
    setSumMetricIds([]);
    setRollingPeriods(3);
    setOutputFormat('number');
    setDecimalPlaces(2);
    setMultiplyBy100(false);
    setPreviewValues({});
  };

  const formatPreviewValue = (value: number | null): string => {
    if (value === null) return '-';
    if (outputFormat === 'percentage' || multiplyBy100) return `${value.toFixed(decimalPlaces)}%`;
    if (outputFormat === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toFixed(decimalPlaces);
  };

  const getMetricName = (id: string) => metrics.find(m => m.id === id)?.name || 'Unknown';

  const toggleSumMetric = (metricId: string) => {
    setSumMetricIds(prev => 
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const renderFormulaInputs = () => {
    switch (formulaType) {
      case 'division':
      case 'multiplication':
      case 'difference':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{formulaType === 'division' ? 'Numerator (Top)' : 'First Value (A)'}</Label>
              <Select value={numeratorId} onValueChange={setNumeratorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {availableMetrics.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center py-2">
              <Badge variant="outline" className="px-4 py-1">
                {formulaType === 'division' ? '÷' : formulaType === 'multiplication' ? '×' : '−'}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label>{formulaType === 'division' ? 'Denominator (Bottom)' : 'Second Value (B)'}</Label>
              <Select value={denominatorId} onValueChange={setDenominatorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {availableMetrics.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formulaType === 'division' && (
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="multiply100"
                  checked={multiplyBy100}
                  onChange={(e) => setMultiplyBy100(e.target.checked)}
                  className="rounded border-border"
                />
                <Label htmlFor="multiply100" className="text-sm cursor-pointer">
                  Multiply result by 100 (for percentages like 0.05 → 5%)
                </Label>
              </div>
            )}
          </div>
        );

      case 'sum':
        return (
          <div className="space-y-4">
            <Label>Select metrics to sum</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-lg">
              {availableMetrics.map(m => (
                <div
                  key={m.id}
                  className={`p-2 rounded cursor-pointer border transition-colors ${
                    sumMetricIds.includes(m.id) 
                      ? 'bg-primary/10 border-primary' 
                      : 'hover:bg-muted border-transparent'
                  }`}
                  onClick={() => toggleSumMetric(m.id)}
                >
                  <span className="text-sm">{m.name}</span>
                </div>
              ))}
            </div>
            {sumMetricIds.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Formula: {sumMetricIds.map(id => getMetricName(id)).join(' + ')}
              </div>
            )}
          </div>
        );

      case 'cumulative':
      case 'year_to_date':
      case 'percentage_change':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Source Metric</Label>
              <Select value={sourceMetricId} onValueChange={setSourceMetricId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {availableMetrics.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              {formulaType === 'cumulative' && 'Calculates running total from the first period.'}
              {formulaType === 'year_to_date' && 'Calculates sum from January 1st of each year.'}
              {formulaType === 'percentage_change' && 'Calculates percentage change from previous period.'}
            </p>
          </div>
        );

      case 'rolling_average':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Source Metric</Label>
              <Select value={sourceMetricId} onValueChange={setSourceMetricId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {availableMetrics.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Number of Periods</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={2}
                  max={12}
                  value={rollingPeriods}
                  onChange={(e) => setRollingPeriods(parseInt(e.target.value) || 3)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">periods (months)</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {isEditMode ? 'Edit Calculated Metric' : 'Create Calculated Metric'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the formula for this calculated metric.'
              : 'Build a formula to automatically calculate values from other metrics.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Metric Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Metric Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Conversion Rate, ROI, Rolling Average Revenue"
                required
              />
            </div>

            {/* Calculation Type Selection */}
            <div className="space-y-3">
              <Label>Calculation Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(CALCULATION_TYPE_LABELS) as CalculationFormulaType[]).map(type => (
                  <div
                    key={type}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      formulaType === type 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setFormulaType(type)}
                  >
                    <div className="w-6 h-6 flex items-center justify-center">
                      {FORMULA_TYPE_ICONS[type]}
                    </div>
                    <span className="text-sm">{CALCULATION_TYPE_LABELS[type]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Formula Inputs */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
              {renderFormulaInputs()}
            </div>

            {/* Output Format */}
            <div className="space-y-3">
              <Label>Output Format</Label>
              <RadioGroup 
                value={outputFormat} 
                onValueChange={(v) => setOutputFormat(v as 'number' | 'percentage' | 'currency')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="number" id="format-number" />
                  <Label htmlFor="format-number" className="cursor-pointer">Number</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="format-percentage" />
                  <Label htmlFor="format-percentage" className="cursor-pointer">Percentage</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="currency" id="format-currency" />
                  <Label htmlFor="format-currency" className="cursor-pointer">Currency</Label>
                </div>
              </RadioGroup>
              <div className="flex items-center gap-2">
                <Label htmlFor="decimals" className="text-sm">Decimal places:</Label>
                <Input
                  id="decimals"
                  type="number"
                  min={0}
                  max={4}
                  value={decimalPlaces}
                  onChange={(e) => setDecimalPlaces(parseInt(e.target.value) || 2)}
                  className="w-16"
                />
              </div>
            </div>

            {/* Live Preview */}
            {currentFormula && (
              <div className="space-y-2">
                <Label>Preview (Last 3 Months)</Label>
                <div className="p-3 bg-muted rounded-lg">
                  {isLoadingPreview ? (
                    <div className="text-center text-muted-foreground py-2">Calculating...</div>
                  ) : (
                    <div className="flex justify-around text-center">
                      {previewPeriods.map(period => (
                        <div key={period} className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(period), 'MMM yyyy')}
                          </div>
                          <div className="font-medium">
                            {formatPreviewValue(previewValues[period] ?? null)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || !currentFormula || isLoading}
            >
              {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Metric' : 'Create Calculated Metric')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
