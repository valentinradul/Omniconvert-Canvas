
import React from 'react';
import { PECTI, PECTIWeights, DEFAULT_PECTI_WEIGHTS, calculatePectiPercentage } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HypothesisPectiEditorProps {
  pectiValues: PECTI;
  weights?: PECTIWeights;
  onPectiChange: (category: keyof PECTI, value: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

const HypothesisPectiEditor: React.FC<HypothesisPectiEditorProps> = ({
  pectiValues,
  weights = DEFAULT_PECTI_WEIGHTS,
  onPectiChange,
  onSave,
  onCancel
}) => {
  const categories = [
    { key: 'potential', label: 'Potential', description: 'Growth potential', weight: weights.potential },
    { key: 'ease', label: 'Ease', description: 'Implementation ease', weight: weights.ease },
    { key: 'cost', label: 'Cost', description: 'Low cost = high score', weight: weights.cost },
    { key: 'time', label: 'Time', description: 'Quick = high score', weight: weights.time },
    { key: 'impact', label: 'Impact', description: 'Business impact', weight: weights.impact }
  ];
  
  const weightedScore = calculatePectiPercentage(pectiValues, weights);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-sm">PECTI Score</h3>
        <Badge variant={weightedScore >= 70 ? 'success' : weightedScore >= 40 ? 'warning' : 'destructive'}>
          {weightedScore}%
        </Badge>
      </div>
      
      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category.key} className="space-y-1">
            <div className="flex justify-between items-center">
              <div>
                <Label className="capitalize">{category.label}</Label>
                {category.weight !== 1 && (
                  <span className="text-xs ml-1 text-muted-foreground">
                    (Weight: {category.weight.toFixed(1)})
                  </span>
                )}
              </div>
              <span className="text-sm font-medium">
                {pectiValues[category.key as keyof PECTI]}
              </span>
            </div>
            <Slider 
              value={[pectiValues[category.key as keyof PECTI]]}
              min={1}
              max={5}
              step={1}
              onValueChange={(value) => onPectiChange(category.key as keyof PECTI, value[0])}
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
