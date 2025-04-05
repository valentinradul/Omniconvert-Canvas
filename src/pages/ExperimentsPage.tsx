
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExperimentFilters from '@/components/experiments/ExperimentFilters';
import ExperimentGrid from '@/components/experiments/ExperimentGrid';
import ExperimentList from '@/components/experiments/ExperimentList';
import ExperimentNoData from '@/components/experiments/ExperimentNoData';

const ExperimentsPage: React.FC = () => {
  const { experiments, hypotheses, getAllUserNames, getHypothesisById, getIdeaById, getExperimentDuration } = useApp();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterResponsible, setFilterResponsible] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  
  const allUsers = getAllUserNames();
  
  const filteredExperiments = experiments.filter(experiment => {
    // Filter by status
    if (filterStatus && experiment.status !== filterStatus) {
      return false;
    }
    
    // Filter by responsible person
    if (filterResponsible && experiment.responsibleUserId !== filterResponsible) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const hypothesis = getHypothesisById(experiment.hypothesisId);
      const idea = hypothesis ? getIdeaById(hypothesis.ideaId) : undefined;
      
      const searchLower = searchQuery.toLowerCase();
      const ideaTitle = idea?.title?.toLowerCase() || '';
      const hypothesisMetric = hypothesis?.metric?.toLowerCase() || '';
      const experimentNotes = experiment.notes?.toLowerCase() || '';
      
      if (!ideaTitle.includes(searchLower) && 
          !hypothesisMetric.includes(searchLower) && 
          !experimentNotes.includes(searchLower)) {
        return false;
      }
    }
    
    return true;
  });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Experiments</h1>
          <p className="text-muted-foreground">Track your growth experiments and their results</p>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <ExperimentFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterResponsible={filterResponsible}
        setFilterResponsible={setFilterResponsible}
        allUsers={allUsers}
      />
      
      {experiments.length === 0 ? (
        <ExperimentNoData />
      ) : (
        <Tabs value={viewMode} className="mt-0">
          <TabsContent value="grid">
            <ExperimentGrid
              experiments={filteredExperiments}
              getHypothesisById={getHypothesisById}
              getIdeaById={getIdeaById}
              getAllUserNames={getAllUserNames}
              getExperimentDuration={getExperimentDuration}
            />
          </TabsContent>
          
          <TabsContent value="list">
            <ExperimentList
              experiments={filteredExperiments}
              getHypothesisById={getHypothesisById}
              getIdeaById={getIdeaById}
              getAllUserNames={getAllUserNames}
              getExperimentDuration={getExperimentDuration}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ExperimentsPage;
