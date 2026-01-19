
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { calculatePectiPercentage, PECTI, Tag, HypothesisStatus } from '@/types';
import HypothesisFilters from '@/components/hypothesis/HypothesisFilters';
import HypothesisTable from '@/components/hypothesis/HypothesisTable';
import EmptyHypothesisList from '@/components/hypothesis/EmptyHypothesisList';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ArchiveLink from '@/components/ArchiveLink';

const HypothesesPage: React.FC = () => {
  const { hypotheses, ideas, experiments, getIdeaById, editHypothesis, departments, getAllTags, getAllUserNames } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
  
  // Debug log to check data
  useEffect(() => {
    console.log('Hypotheses data:', hypotheses);
    console.log('Ideas data:', ideas);
    console.log('Departments:', departments);
    console.log('Tags:', allTags);
    console.log('Users:', allUsers);
    console.log('Current filters state:', filters);
  }, [hypotheses, ideas, departments, allTags, allUsers, filters]);
  
  const filteredHypotheses = React.useMemo(() => {
    console.log('Filtering hypotheses with filters:', filters);
    console.log('Search query:', searchQuery);
    
    return hypotheses.filter(hypothesis => {
      if (searchQuery && !hypothesis.observation.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !hypothesis.initiative.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !hypothesis.metric.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      if (filters.departmentId && filters.departmentId !== 'all') {
        const relatedIdea = ideas.find(i => i.id === hypothesis.ideaId);
        if (!relatedIdea || relatedIdea.departmentId !== filters.departmentId) {
          return false;
        }
      }
      
      if (filters.tag && filters.tag !== 'all') {
        const relatedIdea = ideas.find(i => i.id === hypothesis.ideaId);
        if (!relatedIdea || !relatedIdea.tags || !relatedIdea.tags.includes(filters.tag)) {
          return false;
        }
      }
      
      if (filters.minPectiScore && filters.minPectiScore > 0) {
        const pectiPercentage = calculatePectiPercentage(hypothesis.pectiScore);
        if (pectiPercentage < filters.minPectiScore) {
          return false;
        }
      }
      
      if (filters.userId && filters.userId !== 'all' && hypothesis.userId !== filters.userId) {
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
    console.log('Filter changed:', filterName, value);
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

  const handleStatusChange = (hypothesisId: string, newStatus: HypothesisStatus) => {
    editHypothesis(hypothesisId, { status: newStatus });
    toast({
      title: "Status Updated",
      description: `Hypothesis status changed to ${newStatus}`,
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hypotheses</h1>
          <p className="text-muted-foreground">Test your growth ideas with structured hypotheses</p>
        </div>
        <Button onClick={() => navigate('/ideas')}>
          Create New Hypothesis
        </Button>
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
      
      {hypotheses.length === 0 ? (
        <div>
          <p>No hypotheses available. Create your first hypothesis!</p>
          <EmptyHypothesisList />
        </div>
      ) : filteredHypotheses.length === 0 ? (
        <div>
          <p>No hypotheses match your filters.</p>
          <EmptyHypothesisList />
        </div>
      ) : (
        <>
          <HypothesisTable
            hypotheses={filteredHypotheses}
            departments={departments}
            experiments={experiments}
            getIdeaById={getIdeaById}
            calculatePectiPercentage={calculatePectiPercentage}
          onSortChange={handleSort}
            onEditPecti={handleEditPecti}
            onStatusChange={handleStatusChange}
            sortField={sortField}
          />
          <ArchiveLink />
        </>
      )}
    </div>
  );
};

export default HypothesesPage;
