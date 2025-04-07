
import React from 'react';
import { PECTI } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface HypothesisPectiEditorProps {
  pectiValues: PECTI;
  onPectiChange: (category: keyof PECTI, value: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

const HypothesisPectiEditor: React.FC<HypothesisPectiEditorProps> = ({
  pectiValues,
  onPectiChange,
  onSave,
  onCancel
}) => {
  // Map properties correctly to ensure compatibility
  const categories = [
    { id: 'potential', label: 'Potential' },
    { id: 'ease', label: 'Ease' },
    { id: 'cost', label: 'Cost' }, // This will update both cost and expense internally
    { id: 'time', label: 'Time' },
    { id: 'impact', label: 'Impact' }
  ];
  
  // Special handler for cost to maintain compatibility
  const handleCostChange = (value: number) => {
    onPectiChange('cost', value);
    onPectiChange('expense', value); // Keep expense in sync with cost
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {categories.map((category) => {
          const key = category.id as keyof PECTI;
          return (
            <div key={category.id} className="space-y-1">
              <div className="flex justify-between items-center">
                <Label className="capitalize">{category.label}</Label>
                <span className="text-sm font-medium">
                  {pectiValues[key]}
                </span>
              </div>
              <Slider 
                value={[pectiValues[key]]}
                min={1}
                max={5}
                step={1}
                onValueChange={(value) => {
                  if (category.id === 'cost') {
                    handleCostChange(value[0]);
                  } else {
                    onPectiChange(key, value[0]);
                  }
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          size="sm" 
          onClick={onSave}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default HypothesisPectiEditor;
