
import React from 'react';
import { PECTIWeights } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PectiWeightsEditor from '@/components/hypothesis/PectiWeightsEditor';

interface WeightsTabProps {
  weights: PECTIWeights;
  onWeightChange: (category: keyof PECTIWeights, value: number) => void;
  onSaveWeights: () => void;
  onResetWeights: () => void;
  onUpdateAllHypotheses: () => void;
}

const WeightsTab: React.FC<WeightsTabProps> = ({
  weights,
  onWeightChange,
  onSaveWeights,
  onResetWeights,
  onUpdateAllHypotheses
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Weights Settings</CardTitle>
          <Button 
            variant="outline" 
            onClick={onUpdateAllHypotheses}
          >
            Apply Weights To All Hypotheses
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <PectiWeightsEditor 
          weights={weights}
          onWeightsChange={onWeightChange}
          onSave={onSaveWeights}
          onReset={onResetWeights}
        />
      </CardContent>
    </Card>
  );
};

export default WeightsTab;
