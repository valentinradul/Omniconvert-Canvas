
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/StatusBadge';
import { ExperimentStatus } from '@/types';

interface ExperimentNextStepsCardProps {
  status: ExperimentStatus;
}

const ExperimentNextStepsCard: React.FC<ExperimentNextStepsCardProps> = ({
  status
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Next Steps</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>Based on the current status of <StatusBadge status={status} />, here are recommended next steps:</p>
          
          {status === 'Planned' && (
            <ul className="list-disc ml-6 space-y-2">
              <li>Set a start date for the experiment</li>
              <li>Prepare necessary resources and tools</li>
              <li>Define clear metrics and tracking mechanisms</li>
              <li>Update the status to "Running" once started</li>
            </ul>
          )}
          
          {status === 'Running' && (
            <ul className="list-disc ml-6 space-y-2">
              <li>Monitor results regularly</li>
              <li>Document observations and insights</li>
              <li>Prepare for analysis at experiment conclusion</li>
              <li>Update status based on findings</li>
            </ul>
          )}
          
          {status === 'Paused' && (
            <ul className="list-disc ml-6 space-y-2">
              <li>Identify and document the blockers</li>
              <li>Develop action plan to resolve issues</li>
              <li>Consider timeline adjustments</li>
              <li>Update status once blockage is resolved</li>
            </ul>
          )}
          
          {status === 'Winning' && (
            <ul className="list-disc ml-6 space-y-2">
              <li>Document successful strategies</li>
              <li>Plan for broader implementation</li>
              <li>Share learnings with the team</li>
              <li>Consider follow-up experiments to optimize further</li>
            </ul>
          )}
          
          {status === 'Losing' && (
            <ul className="list-disc ml-6 space-y-2">
              <li>Analyze what went wrong</li>
              <li>Document lessons learned</li>
              <li>Adjust hypothesis or approach</li>
              <li>Consider new experiments based on learnings</li>
            </ul>
          )}
          
          {status === 'Inconclusive' && (
            <ul className="list-disc ml-6 space-y-2">
              <li>Review experiment design and metrics</li>
              <li>Identify what made results inconclusive</li>
              <li>Consider adjusting hypothesis or measurement approach</li>
              <li>Plan for a refined experiment if warranted</li>
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExperimentNextStepsCard;
