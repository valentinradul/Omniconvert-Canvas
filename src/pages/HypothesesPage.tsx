
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { calculatePectiPercentage, PECTI, Tag } from '@/types';
import HypothesisFilters from '@/components/hypothesis/HypothesisFilters';
import HypothesisTable from '@/components/hypothesis/HypothesisTable';
import EmptyHypothesisList from '@/components/hypothesis/EmptyHypothesisList';

const HypothesesPage: React.FC = () => {
  const { hypotheses, ideas, experiments, getIdeaById, editHypothesis, departments, getAllTags, getAllUserNames } = useApp();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'pectiScore' | 'createdAt'>('pectiScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<{
    departmentId?: string;
    tag?: Tag;
    minPectiScore?: number;
    userId?: string;
  }>({});
  
  const allTags = getAllTags();
  const allUsers = getAllUserNames();
  
  const filteredHypotheses = React.useMemo(() => {
    return hypotheses.filter(hypothesis => {
      if (searchQuery && !hypothesis.observation.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !hypothesis.initiative.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !hypothesis.metric.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      if (filters.departmentId) {
        const relatedIdea = ideas.find(i => i.id === hypothesis.ideaId);
        if (!relatedIdea || relatedIdea.departmentId !== filters.departmentId) {
          return false;
        }
      }
      
      if (filters.tag) {
        const relatedIdea = ideas.find(i => i.id === hypothesis.ideaId);
        if (!relatedIdea || !relatedIdea.tags || !relatedIdea.tags.includes(filters.tag)) {
          return false;
        }
      }
      
      if (filters.minPectiScore) {
        const pectiPercentage = calculatePectiPercentage(hypothesis.pectiScore);
        if (pectiPercentage < filters.minPectiScore) {
          return false;
        }
      }
      
      if (filters.userId && hypothesis.userId !== filters.userId) {
        return false;
        }
      
      return true;
    }).sort((a, b) => {
      if (sortField === 'pectiScore') {
        const scoreA = calculatePectiPercentage(a.pectiScore);
        const scoreB = calculatePectiPercentage(b.pectiScore);
        return sortDirection === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      } else {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });
  }, [hypotheses, ideas, searchQuery, filters, sortField, sortDirection]);
  
  const handleSort = (field: 'pectiScore' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const handleFilterChange = (filterName: keyof typeof filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const handleEditPecti = (hypothesisId: string, pectiValues: PECTI) => {
    editHypothesis(hypothesisId, { 
      pectiScore: pectiValues 
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hypotheses</h1>
          <p className="text-muted-foreground">Test your growth ideas with structured hypotheses</p>
        </div>
      </div>
      
      <HypothesisFilters
        departments={departments}
        allTags={allTags}
        allUsers={allUsers}
        searchQuery={searchQuery}
        filters={filters}
        onSearchChange={setSearchQuery}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />
      
      {filteredHypotheses.length === 0 ? (
        <EmptyHypothesisList />
      ) : (
        <HypothesisTable
          hypotheses={filteredHypotheses}
          departments={departments}
          experiments={experiments}
          getIdeaById={getIdeaById}
          calculatePectiPercentage={calculatePectiPercentage}
          onSortChange={handleSort}
          onEditPecti={handleEditPecti}
          sortField={sortField}
        />
      )}
    </div>
  );
};

export default HypothesesPage;
