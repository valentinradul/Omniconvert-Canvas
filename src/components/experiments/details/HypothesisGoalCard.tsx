
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Hypothesis } from '@/types';

interface HypothesisGoalCardProps {
  hypothesis: Hypothesis;
}

const HypothesisGoalCard: React.FC<HypothesisGoalCardProps> = ({
  hypothesis
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Experiment Goal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p><span className="font-medium">Based on the hypothesis:</span></p>
          <p className="text-muted-foreground">
            Because we observed {hypothesis.observation}, 
            we will do {hypothesis.initiative}, 
            with the measurable goal to improve {hypothesis.metric}.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HypothesisGoalCard;
