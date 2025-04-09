
import React from 'react';
import { PECTIWeights } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PectiWeightsEditorProps {
  weights: PECTIWeights;
  onWeightsChange: (category: keyof PECTIWeights, value: number) => void;
  onSave?: () => void;
  onReset?: () => void;
}

const PectiWeightsEditor: React.FC<PectiWeightsEditorProps> = ({
  weights,
  onWeightsChange,
  onSave,
  onReset
}) => {
  const weightCategories = [
    { key: 'potential' as keyof PECTIWeights, label: 'Potential', description: 'Growth potential' },
    { key: 'ease' as keyof PECTIWeights, label: 'Ease', description: 'Implementation ease' },
    { key: 'cost' as keyof PECTIWeights, label: 'Cost', description: 'Low cost = high weight' },
    { key: 'time' as keyof PECTIWeights, label: 'Time', description: 'Quick = high weight' },
    { key: 'impact' as keyof PECTIWeights, label: 'Impact', description: 'Business impact' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>PECTI Criteria Weights</CardTitle>
        <CardDescription>Adjust the importance of each criterion in the PECTI score calculation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-6">
          {weightCategories.map((category) => (
            <div key={category.key} className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="capitalize">{category.label}</Label>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </div>
                <div className="font-medium text-sm">
                  Weight: {weights[category.key].toFixed(1)}
                </div>
              </div>
              <Slider 
                value={[weights[category.key]]}
                min={0.1}
                max={3}
                step={0.1}
                onValueChange={(value) => onWeightsChange(category.key, value[0])}
              />
            </div>
          ))}
        </div>
        
        {(onSave || onReset) && (
          <div className="flex justify-end space-x-2 pt-2">
            {onReset && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onReset}
              >
                Reset to Default
              </Button>
            )}
            {onSave && (
              <Button 
                size="sm" 
                onClick={onSave}
              >
                Save Weights
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PectiWeightsEditor;
