
import { useState, useMemo } from 'react';
import { 
  GrowthIdea, 
  Hypothesis, 
  Experiment, 
  Category, 
  Tag,
  HypothesisStatus 
} from '@/types';
import { isAfter, startOfToday, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';

type TimeFrame = 'today' | 'week' | 'month' | 'quarter' | 'year';

interface Filters {
  department?: string;
  category?: Category;
  status?: HypothesisStatus;
  tag?: Tag;
  userId?: string;
  timeframe?: TimeFrame;
}

export const useDashboardFilter = (
  ideas: GrowthIdea[],
  hypotheses: Hypothesis[],
  experiments: Experiment[]
) => {
  const [filters, setFilters] = useState<Filters>({});
  const [searchQuery, setSearchQuery] = useState('');

  const handleFilterChange = (filterName: string, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const getCutoffDate = (timeframe?: TimeFrame) => {
    if (!timeframe) return null;
    
    switch (timeframe) {
      case 'today':
        return startOfToday();
      case 'week':
        return startOfWeek(new Date());
      case 'month':
        return startOfMonth(new Date());
      case 'quarter':
        return startOfQuarter(new Date());
      case 'year':
        return startOfYear(new Date());
      default:
        return null;
    }
  };

  const filteredIdeas = useMemo(() => {
    return ideas.filter(idea => {
      // Search query
      if (searchQuery && !idea.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !idea.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Department filter
      if (filters.department && idea.departmentId !== filters.department) {
        return false;
      }
      
      // Category filter
      if (filters.category && idea.category !== filters.category) {
        return false;
      }
      
      // Tag filter
      if (filters.tag && (!idea.tags || !idea.tags.includes(filters.tag))) {
        return false;
      }
      
      // User filter
      if (filters.userId && idea.userId !== filters.userId) {
        return false;
      }
      
      // Timeframe filter
      if (filters.timeframe) {
        const cutoffDate = getCutoffDate(filters.timeframe);
        if (cutoffDate && !isAfter(new Date(idea.createdAt), cutoffDate)) {
          return false;
        }
      }
      
      return true;
    });
  }, [ideas, filters, searchQuery]);

  const filteredHypotheses = useMemo(() => {
    return hypotheses.filter(hypothesis => {
      // Search query
      if (searchQuery && !hypothesis.metric.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !hypothesis.initiative.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (filters.status && hypothesis.status !== filters.status) {
        return false;
      }
      
      // User filter
      if (filters.userId && hypothesis.userId !== filters.userId) {
        return false;
      }
      
      // Department filter and Category filter (need to check related idea)
      if (filters.department || filters.category || filters.tag) {
        const relatedIdea = ideas.find(i => i.id === hypothesis.ideaId);
        if (!relatedIdea) return false;
        
        if (filters.department && relatedIdea.departmentId !== filters.department) {
          return false;
        }
        
        if (filters.category && relatedIdea.category !== filters.category) {
          return false;
        }
        
        // Tag filter (check related idea)
        if (filters.tag && (!relatedIdea.tags || !relatedIdea.tags.includes(filters.tag))) {
          return false;
        }
      }
      
      // Timeframe filter
      if (filters.timeframe) {
        const cutoffDate = getCutoffDate(filters.timeframe);
        if (cutoffDate && !isAfter(new Date(hypothesis.createdAt), cutoffDate)) {
          return false;
        }
      }
      
      return true;
    });
  }, [hypotheses, ideas, filters, searchQuery]);

  const filteredExperiments = useMemo(() => {
    return experiments.filter(experiment => {
      if (filters.userId && experiment.userId !== filters.userId) {
        return false;
      }
      
      // Timeframe filter
      if (filters.timeframe) {
        const cutoffDate = getCutoffDate(filters.timeframe);
        if (cutoffDate && !isAfter(new Date(experiment.createdAt), cutoffDate)) {
          return false;
        }
      }
      
      return true;
    });
  }, [experiments, filters]);

  return {
    filters,
    searchQuery,
    setSearchQuery,
    filteredIdeas,
    filteredHypotheses,
    filteredExperiments,
    handleFilterChange,
    handleClearFilters
  };
};
