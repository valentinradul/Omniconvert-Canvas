
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ExperimentNotesCardProps {
  notes?: string;
}

const ExperimentNotesCard: React.FC<ExperimentNotesCardProps> = ({
  notes
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Experiment Notes</CardTitle>
      </CardHeader>
      <CardContent>
        {notes ? (
          <p>{notes}</p>
        ) : (
          <p className="text-muted-foreground">No notes added yet.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ExperimentNotesCard;
