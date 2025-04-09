
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ArrowUpDown, User, Edit } from 'lucide-react';
import PectiScoreDisplay from '@/components/PectiScoreDisplay';
import { PECTI } from '@/types';

type SortField = 'status' | 'createdAt' | 'pectiScore';

const ExperimentsPage: React.FC = () => {
  const { experiments, hypotheses, getHypothesisById, getIdeaById } = useApp();
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const sortedExperiments = [...experiments].sort((a, b) => {
    if (sortField === 'status') {
      return sortDirection === 'asc' 
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    } else if (sortField === 'pectiScore') {
      const hypothesisA = getHypothesisById(a.hypothesisId);
      const hypothesisB = getHypothesisById(b.hypothesisId);
      const scoreA = hypothesisA ? calculateTotalScore(hypothesisA.pectiScore) : 0;
      const scoreB = hypothesisB ? calculateTotalScore(hypothesisB.pectiScore) : 0;
      return sortDirection === 'asc' ? scoreA - scoreB : scoreB - scoreA;
    } else {
      // Default sort by createdAt
      return sortDirection === 'asc' 
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
  
  const calculateTotalScore = (pecti: PECTI | undefined) => {
    if (!pecti) return 0;
    return pecti.potential + pecti.ease + pecti.cost + pecti.time + pecti.impact;
  };
  
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
        <Table className="border rounded-md">
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">Experiment/Idea</TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  {sortField === 'status' && (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort('pectiScore')}
              >
                <div className="flex items-center">
                  PECTI Score
                  {sortField === 'pectiScore' && (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Responsible</TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center">
                  Dates
                  {sortField === 'createdAt' && (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedExperiments.map(experiment => {
              const hypothesis = getHypothesisById(experiment.hypothesisId);
              const idea = hypothesis ? getIdeaById(hypothesis.ideaId) : undefined;
              
              return (
                <TableRow key={experiment.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {idea?.title || 'Experiment'}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {hypothesis?.initiative || 'No hypothesis description'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={experiment.status} />
                  </TableCell>
                  <TableCell>
                    {hypothesis?.pectiScore ? (
                      <PectiScoreDisplay 
                        pecti={hypothesis.pectiScore} 
                        size="sm"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">No score</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <User className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      <span>{experiment.userName || hypothesis?.userName || 'Unassigned'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="font-medium">Start:</span>{' '}
                        {experiment.startDate 
                          ? new Date(experiment.startDate).toLocaleDateString() 
                          : 'Not set'}
                      </div>
                      <div>
                        <span className="font-medium">End:</span>{' '}
                        {experiment.endDate 
                          ? new Date(experiment.endDate).toLocaleDateString() 
                          : 'Not set'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/hypothesis-details/${hypothesis?.id}`)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit Hypothesis
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => navigate(`/experiment-details/${experiment.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ExperimentsPage;
