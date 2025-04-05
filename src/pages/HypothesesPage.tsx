
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import PectiScoreDisplay from '@/components/PectiScoreDisplay';

const HypothesesPage: React.FC = () => {
  const { hypotheses, ideas, experiments, getIdeaById } = useApp();
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hypotheses</h1>
          <p className="text-muted-foreground">Test your growth ideas with structured hypotheses</p>
        </div>
      </div>
      
      {hypotheses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <h3 className="text-xl font-medium">No hypotheses yet</h3>
          <p className="text-muted-foreground mb-4">Convert ideas into hypotheses to get started</p>
          <Button onClick={() => navigate('/ideas')}>View Ideas</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hypotheses.map(hypothesis => {
            const idea = getIdeaById(hypothesis.ideaId);
            const hasExperiment = experiments.some(e => e.hypothesisId === hypothesis.id);
            
            return (
              <Card key={hypothesis.id}>
                <CardHeader>
                  <CardTitle>
                    {idea?.title || 'Hypothesis'}
                  </CardTitle>
                  <CardDescription>
                    Created on {new Date(hypothesis.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Because we observed:</span> {hypothesis.observation}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">We will do:</span> {hypothesis.initiative}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">With the measurable goal to improve:</span> {hypothesis.metric}
                  </p>
                  
                  <div className="pt-2">
                    <p className="text-xs text-center text-muted-foreground mb-1">PECTI Score</p>
                    <PectiScoreDisplay pecti={hypothesis.pectiScore} />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    onClick={() => navigate(`/hypothesis-details/${hypothesis.id}`)}
                    variant="outline"
                  >
                    View Details
                  </Button>
                  {!hasExperiment && (
                    <Button
                      onClick={() => navigate(`/create-experiment/${hypothesis.id}`)}
                    >
                      Create Experiment
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HypothesesPage;
