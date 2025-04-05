
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';

const Dashboard: React.FC = () => {
  const { ideas, hypotheses, experiments } = useApp();
  const navigate = useNavigate();
  
  const recentExperiments = [...experiments]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const countByStatus = experiments.reduce((acc, exp) => {
    acc[exp.status] = (acc[exp.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Track your growth experiments and their progress.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card onClick={() => navigate('/ideas')} className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Growth Ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ideas.length}</div>
            <p className="text-xs text-muted-foreground">Total ideas in backlog</p>
          </CardContent>
        </Card>
        
        <Card onClick={() => navigate('/hypotheses')} className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hypotheses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hypotheses.length}</div>
            <p className="text-xs text-muted-foreground">Formulated hypotheses</p>
          </CardContent>
        </Card>
        
        <Card onClick={() => navigate('/experiments')} className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Experiments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{experiments.length}</div>
            <p className="text-xs text-muted-foreground">Total experiments</p>
          </CardContent>
        </Card>
        
        <Card className="bg-status-winning/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {experiments.length 
                ? Math.round((countByStatus['Winning'] || 0) / experiments.length * 100) + '%' 
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Experiments with "Winning" status</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Experiment Activity</CardTitle>
          <CardDescription>Latest updates from your running experiments</CardDescription>
        </CardHeader>
        <CardContent>
          {recentExperiments.length > 0 ? (
            <div className="space-y-4">
              {recentExperiments.map(experiment => {
                const hypothesis = hypotheses.find(h => h.id === experiment.hypothesisId);
                return (
                  <div key={experiment.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <h3 className="font-medium">{hypothesis?.metric}</h3>
                      <p className="text-sm text-muted-foreground">
                        Updated {new Date(experiment.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={experiment.status} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No experiments yet</p>
              <button 
                className="mt-2 text-primary hover:underline"
                onClick={() => navigate('/experiments')}
              >
                Create your first experiment
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
