
import { useState } from 'react';
import { Experiment, PECTI } from '@/types';

type SortField = 'status' | 'createdAt' | 'pectiScore';

interface UseSortExperimentsProps {
  experiments: Experiment[];
  getHypothesisById: (id: string) => any;
}

interface UseSortExperimentsResult {
  sortedExperiments: Experiment[];
  sortField: SortField;
  sortDirection: 'asc' | 'desc';
  handleSort: (field: SortField) => void;
}

const calculateTotalScore = (pecti: PECTI | undefined) => {
  if (!pecti) return 0;
  return pecti.potential + pecti.ease + pecti.cost + pecti.time + pecti.impact;
};

export const useExperimentSorting = ({
  experiments,
  getHypothesisById
}: UseSortExperimentsProps): UseSortExperimentsResult => {
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
  
  return {
    sortedExperiments,
    sortField,
    sortDirection,
    handleSort
  };
};
