
import React from 'react';
import { PECTI, PECTIWeights } from '@/types';
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
  weights = { potential: 1, ease: 1, cost: 1, time: 1, impact: 1 },
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
  
  // Calculate weighted score
  const calculateWeightedScore = () => {
    const { potential, ease, cost, time, impact } = pectiValues;
    const totalWeight = weights.potential + weights.ease + weights.cost + weights.time + weights.impact;
    const weightedTotal = 
      potential * weights.potential + 
      ease * weights.ease + 
      cost * weights.cost + 
      time * weights.time + 
      impact * weights.impact;
    
    return Math.round((weightedTotal / (5 * totalWeight)) * 100);
  };
  
  const weightedScore = calculateWeightedScore();
  
  // Function to get the badge styling based on score
  const getBadgeVariant = (score: number) => {
    if (score >= 70) return "success";
    if (score >= 40) return "warning";
    return "destructive";
  };
  
  // Function to get a className for the badge based on score since we can't use custom variants
  const getBadgeClassName = (score: number) => {
    if (score >= 70) return "bg-green-100 text-green-800 hover:bg-green-100";
    if (score >= 40) return "bg-amber-100 text-amber-800 hover:bg-amber-100";
    return "bg-red-100 text-red-800 hover:bg-red-100";
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-sm">PECTI Score</h3>
        <Badge className={getBadgeClassName(weightedScore)}>
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
