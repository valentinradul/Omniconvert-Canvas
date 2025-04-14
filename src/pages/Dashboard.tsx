
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { HypothesisStatus } from '@/types';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardSearch from '@/components/dashboard/DashboardSearch';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardFilters from '@/components/DashboardFilters';
import KanbanBoard from '@/components/KanbanBoard';
import CreateHypothesisModal from '@/components/CreateHypothesisModal';

import { useDashboardFilter } from '@/hooks/useDashboardFilter';

const Dashboard: React.FC = () => {
  const { ideas, hypotheses, experiments, editHypothesis, getIdeaById } = useApp();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  
  // Get all unique tags from ideas
  const allTags = React.useMemo(() => {
    const tagsSet = new Set();
    ideas.forEach(idea => {
      if (idea.tags) {
        idea.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  }, [ideas]);
  
  // Get all unique users
  const allUsers = React.useMemo(() => {
    const usersMap = new Map();
    
    [...ideas, ...hypotheses, ...experiments].forEach(item => {
      if (item.userId && item.userName) {
        usersMap.set(item.userId, item.userName);
      }
    });
    
    return Array.from(usersMap.entries()).map(([id, name]) => ({ id, name }));
  }, [ideas, hypotheses, experiments]);
  
  const {
    filters,
    searchQuery,
    setSearchQuery,
    filteredIdeas,
    filteredHypotheses,
    filteredExperiments,
    handleFilterChange,
    handleClearFilters
  } = useDashboardFilter(ideas, hypotheses, experiments);

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
  
  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Dashboard" 
        description="Track and manage your growth experiments"
      />
      
      <div className="flex gap-6">
        <div className="flex-1">
          <DashboardSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          
          <Tabs defaultValue="progress">
            <div className="mb-4 flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="progress">Progress View</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="progress" className="mt-0">
              <KanbanBoard 
                ideas={filteredIdeas}
                hypotheses={filteredHypotheses}
                experiments={filteredExperiments}
                onHypothesisStatusChange={handleHypothesisStatusChange}
                onIdeaToHypothesis={handleIdeaToHypothesis}
              />
            </TabsContent>
            
            <TabsContent value="stats" className="mt-0">
              <DashboardStats
                ideasCount={filteredIdeas.length}
                hypotheses={filteredHypotheses}
                experiments={filteredExperiments}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="w-80">
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
