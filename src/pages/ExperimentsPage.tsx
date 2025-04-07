
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';

const ExperimentsPage: React.FC = () => {
  const { experiments, hypotheses, getHypothesisById, getIdeaById } = useApp();
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Experiments</h1>
          <p className="text-muted-foreground">Track your growth experiments and their results</p>
        </div>
      </div>
      
      {experiments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <h3 className="text-xl font-medium">No experiments yet</h3>
          <p className="text-muted-foreground mb-4">Create experiments from your hypotheses</p>
          <Button onClick={() => navigate('/hypotheses')}>View Hypotheses</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {experiments.map(experiment => {
            const hypothesis = getHypothesisById(experiment.hypothesisId);
            const idea = hypothesis ? getIdeaById(hypothesis.ideaId) : undefined;
            
            return (
              <Card key={experiment.id}>
                <CardHeader>
                  <div className="flex justify-between">
                    <div>
                      <CardTitle>
                        {idea?.title || 'Experiment'}
                      </CardTitle>
                      <CardDescription>
                        Created on {new Date(experiment.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <StatusBadge status={experiment.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hypothesis && (
                    <p className="text-sm">
                      <span className="font-medium">Goal:</span> {hypothesis.metric}
                    </p>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium">Start Date</p>
                      <p className="text-muted-foreground">
                        {experiment.startDate 
                          ? new Date(experiment.startDate).toLocaleDateString() 
                          : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">End Date</p>
                      <p className="text-muted-foreground">
                        {experiment.endDate 
                          ? new Date(experiment.endDate).toLocaleDateString() 
                          : 'Not set'}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => navigate(`/experiment-details/${experiment.id}`)}
                    className="w-full"
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExperimentsPage;
