
import React from 'react';
import { PECTI, PECTIWeights } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import PectiScoreDisplay from '@/components/PectiScoreDisplay';
import HypothesisPectiEditor from '@/components/hypothesis/HypothesisPectiEditor';

interface PectiScoreTabProps {
  pectiScore: PECTI;
  weights: PECTIWeights;
  editingPecti: boolean;
  tempPecti: PECTI;
  localWeights: PECTIWeights;
  onEditPectiClick: () => void;
  onPectiChange: (category: keyof PECTI, value: number) => void;
  onLocalWeightChange: (category: keyof PECTIWeights, value: number) => void;
  onSavePecti: () => void;
  onCancelPecti: () => void;
}

const PectiScoreTab: React.FC<PectiScoreTabProps> = ({
  pectiScore,
  weights,
  editingPecti,
  tempPecti,
  localWeights,
  onEditPectiClick,
  onPectiChange,
  onLocalWeightChange,
  onSavePecti,
  onCancelPecti
}) => {
  const totalPectiScore = 
    pectiScore.potential + 
    pectiScore.ease + 
    pectiScore.cost + 
    pectiScore.time + 
    pectiScore.impact;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>PECTI Score: {totalPectiScore}/25</CardTitle>
            <CardDescription>
              Evaluating Potential, Ease, Cost, Time, and Impact with custom weights applied
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onEditPectiClick}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {editingPecti ? (
          <HypothesisPectiEditor
            pectiValues={tempPecti}
            weights={localWeights}
            onPectiChange={onPectiChange}
            onWeightsChange={onLocalWeightChange}
            onSave={onSavePecti}
            onCancel={onCancelPecti}
          />
        ) : (
          <div className="flex flex-col items-center">
            <PectiScoreDisplay pecti={pectiScore} weights={weights} />
            <div className="grid grid-cols-5 gap-6 mt-6 text-center">
              <div>
                <p className="font-medium">Potential</p>
                <p className="text-muted-foreground text-sm">Growth potential</p>
                <p className="text-xs text-primary">Weight: {weights.potential.toFixed(1)}</p>
              </div>
              <div>
                <p className="font-medium">Ease</p>
                <p className="text-muted-foreground text-sm">Implementation ease</p>
                <p className="text-xs text-primary">Weight: {weights.ease.toFixed(1)}</p>
              </div>
              <div>
                <p className="font-medium">Cost</p>
                <p className="text-muted-foreground text-sm">Low cost = high score</p>
                <p className="text-xs text-primary">Weight: {weights.cost.toFixed(1)}</p>
              </div>
              <div>
                <p className="font-medium">Time</p>
                <p className="text-muted-foreground text-sm">Quick = high score</p>
                <p className="text-xs text-primary">Weight: {weights.time.toFixed(1)}</p>
              </div>
              <div>
                <p className="font-medium">Impact</p>
                <p className="text-muted-foreground text-sm">Business impact</p>
                <p className="text-xs text-primary">Weight: {weights.impact.toFixed(1)}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PectiScoreTab;
