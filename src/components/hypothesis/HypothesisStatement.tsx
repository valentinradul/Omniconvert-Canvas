
import React from 'react';
import { Hypothesis } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EditHypothesisForm from '@/components/hypothesis/EditHypothesisForm';
import ObservationContentDisplay from '@/components/ObservationContentDisplay';

interface HypothesisStatementProps {
  hypothesis: Hypothesis;
  isEditing: boolean;
  onSave: (updatedHypothesis: Partial<Hypothesis>) => void;
  onCancel: () => void;
}

const HypothesisStatement: React.FC<HypothesisStatementProps> = ({
  hypothesis,
  isEditing,
  onSave,
  onCancel
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hypothesis Statement</CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <EditHypothesisForm 
            hypothesis={hypothesis} 
            onSave={onSave} 
            onCancel={onCancel} 
          />
        ) : (
          <div className="space-y-4">
            <p>
              <span className="font-medium">Because we observed:</span> {hypothesis.observation}
            </p>
            {hypothesis.observationContent && (
              <ObservationContentDisplay content={hypothesis.observationContent} />
            )}
            <p>
              <span className="font-medium">We will do:</span> {hypothesis.initiative}
            </p>
            <p>
              <span className="font-medium">With the measurable goal to improve:</span> {hypothesis.metric}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HypothesisStatement;
