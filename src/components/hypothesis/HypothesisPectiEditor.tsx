
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
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {['potential', 'ease', 'cost', 'time', 'impact'].map((category) => (
          <div key={category} className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="capitalize">{category}</Label>
              <span className="text-sm font-medium">
                {pectiValues[category as keyof PECTI]}
              </span>
            </div>
            <Slider 
              value={[pectiValues[category as keyof PECTI]]}
              min={1}
              max={5}
              step={1}
              onValueChange={(value) => onPectiChange(category as keyof PECTI, value[0])}
            />
          </div>
        ))}
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
