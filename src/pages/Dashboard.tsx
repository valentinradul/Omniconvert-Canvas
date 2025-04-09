
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Category,
  Tag,
  HypothesisStatus,
} from '@/types';
import { useToast } from '@/hooks/use-toast';
import KanbanBoard from '@/components/KanbanBoard';
import DashboardFilters from '@/components/DashboardFilters';
import CreateHypothesisModal from '@/components/CreateHypothesisModal';
import { useNavigate } from 'react-router-dom';
import { subDays, startOfToday, startOfWeek, startOfMonth, startOfQuarter, startOfYear, isAfter } from 'date-fns';
import StatisticsPanel from '@/components/dashboard/StatisticsPanel';
import FilterBar from '@/components/dashboard/FilterBar';

const Dashboard: React.FC = () => {
  const { ideas, hypotheses, experiments, editHypothesis, getIdeaById } = useApp();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState<{
    department?: string;
    category?: Category;
    status?: string;
    tag?: Tag;
    userId?: string;
    timeframe?: 'today' | 'week' | 'month' | 'quarter' | 'year';
  }>({});
  
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Collect all unique tags from ideas
  const allTags = React.useMemo(() => {
    const tagsSet = new Set<Tag>();
    ideas.forEach(idea => {
      if (idea.tags) {
        idea.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  }, [ideas]);
  
  // Collect all unique users
  const allUsers = React.useMemo(() => {
    const usersMap = new Map<string, string>();
    
    [...ideas, ...hypotheses, ...experiments].forEach(item => {
      if (item.userId && item.userName) {
        usersMap.set(item.userId, item.userName);
      }
    });
    
    return Array.from(usersMap.entries()).map(([id, name]) => ({ id, name }));
  }, [ideas, hypotheses, experiments]);
  
  // Apply filters to ideas
  const filteredIdeas = React.useMemo(() => {
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
        const createdDate = new Date(idea.createdAt);
        let cutoffDate;
        
        switch (filters.timeframe) {
          case 'today':
            cutoffDate = startOfToday();
            break;
          case 'week':
            cutoffDate = startOfWeek(new Date());
            break;
          case 'month':
            cutoffDate = startOfMonth(new Date());
            break;
          case 'quarter':
            cutoffDate = startOfQuarter(new Date());
            break;
          case 'year':
            cutoffDate = startOfYear(new Date());
            break;
        }
        
        if (!isAfter(createdDate, cutoffDate)) {
          return false;
        }
      }
      
      return true;
    });
  }, [ideas, filters, searchQuery]);
  
  // Apply filters to hypotheses
  const filteredHypotheses = React.useMemo(() => {
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
      if (filters.department || filters.category) {
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
        const createdDate = new Date(hypothesis.createdAt);
        let cutoffDate;
        
        switch (filters.timeframe) {
          case 'today':
            cutoffDate = startOfToday();
            break;
          case 'week':
            cutoffDate = startOfWeek(new Date());
            break;
          case 'month':
            cutoffDate = startOfMonth(new Date());
            break;
          case 'quarter':
            cutoffDate = startOfQuarter(new Date());
            break;
          case 'year':
            cutoffDate = startOfYear(new Date());
            break;
        }
        
        if (!isAfter(createdDate, cutoffDate)) {
          return false;
        }
      }
      
      return true;
    });
  }, [hypotheses, ideas, filters, searchQuery]);

  // Filter experiments based on the same criteria
  const filteredExperiments = React.useMemo(() => {
    return experiments.filter(experiment => {
      if (filters.userId && experiment.userId !== filters.userId) {
        return false;
      }
      
      // Timeframe filter
      if (filters.timeframe) {
        const createdDate = new Date(experiment.createdAt);
        let cutoffDate;
        
        switch (filters.timeframe) {
          case 'today':
            cutoffDate = startOfToday();
            break;
          case 'week':
            cutoffDate = startOfWeek(new Date());
            break;
          case 'month':
            cutoffDate = startOfMonth(new Date());
            break;
          case 'quarter':
            cutoffDate = startOfQuarter(new Date());
            break;
          case 'year':
            cutoffDate = startOfYear(new Date());
            break;
        }
        
        if (!isAfter(createdDate, cutoffDate)) {
          return false;
        }
      }
      
      return true;
    });
  }, [experiments, filters]);

  const handleHypothesisStatusChange = (hypothesisId: string, newStatus: HypothesisStatus) => {
    editHypothesis(hypothesisId, { status: newStatus });
    toast({
      title: "Status Updated",
      description: `Hypothesis moved to ${newStatus}`
    });
  };
  
  const handleIdeaToHypothesis = (ideaId: string) => {
    const idea = getIdeaById(ideaId);
    if (idea) {
      setSelectedIdeaId(ideaId);
    }
  };
  
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

  const hasActiveFilters = Object.values(filters).some(Boolean) || !!searchQuery;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Track and manage your growth experiments</p>
        </div>
        <Button onClick={() => navigate('/ideas')}>Add New Idea</Button>
      </div>
      
      {/* Statistics Panel - Always Visible */}
      <StatisticsPanel 
        ideas={ideas}
        hypotheses={hypotheses}
        experiments={experiments}
        filteredIdeas={filteredIdeas}
        filteredHypotheses={filteredHypotheses}
        filteredExperiments={filteredExperiments}
      />
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="bg-white rounded-lg border mb-4 p-4">
            <FilterBar 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium mb-4">Growth Pipeline</h3>
            <KanbanBoard 
              ideas={filteredIdeas}
              hypotheses={filteredHypotheses}
              experiments={filteredExperiments}
              onHypothesisStatusChange={handleHypothesisStatusChange}
              onIdeaToHypothesis={handleIdeaToHypothesis}
            />
          </div>
        </div>
        
        <div className="w-full lg:w-80">
          <DashboardFilters 
            departments={[]}
            allTags={allTags}
            allUsers={allUsers}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>
      </div>
      
      {selectedIdeaId && (
        <CreateHypothesisModal
          idea={getIdeaById(selectedIdeaId)!}
          open={!!selectedIdeaId}
          onClose={() => setSelectedIdeaId(null)}
          onComplete={() => {
            setSelectedIdeaId(null);
            toast({
              title: "Hypothesis Created",
              description: "Your hypothesis has been added to the board."
            });
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
