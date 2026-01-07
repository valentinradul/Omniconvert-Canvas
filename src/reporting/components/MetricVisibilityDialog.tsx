import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ReportingMetric, ReportingCategory } from '@/types/reporting';

interface MetricVisibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: ReportingMetric | null;
  categories: ReportingCategory[];
  currentCategoryId: string;
  onSubmit: (metricId: string, categoryIds: string[]) => void;
  isLoading?: boolean;
  existingVisibility: string[];
}

export const MetricVisibilityDialog: React.FC<MetricVisibilityDialogProps> = ({
  open,
  onOpenChange,
  metric,
  categories,
  currentCategoryId,
  onSubmit,
  isLoading,
  existingVisibility,
}) => {
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(existingVisibility);

  React.useEffect(() => {
    setSelectedCategories(existingVisibility);
  }, [existingVisibility, open]);

  const handleToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = () => {
    if (metric) {
      onSubmit(metric.id, selectedCategories);
    }
  };

  // Filter out the current category since the metric is already there
  const otherCategories = categories.filter((c) => c.id !== currentCategoryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Show Metric in Other Views</DialogTitle>
          <DialogDescription>
            Select which views should also display "{metric?.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {otherCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other categories available.</p>
          ) : (
            otherCategories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => handleToggle(category.id)}
                />
                <Label htmlFor={category.id} className="cursor-pointer">
                  {category.name}
                </Label>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
