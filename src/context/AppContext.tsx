
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useCompany } from './company/CompanyContext';
import { useIdeas } from './hooks/useIdeas';
import { useHypotheses } from './hooks/useHypotheses';
import { useExperiments } from './hooks/useExperiments';
import { useDepartments } from './hooks/useDepartments';
import { useCategories } from './hooks/useCategories';
import { usePectiWeights } from './hooks/usePectiWeights';
import { AppContextType } from './types/AppContextTypes';
import { Tag } from '@/types';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  const { hypotheses, isLoading: hypothesesLoading, addHypothesis, editHypothesis, deleteHypothesis, getHypothesisById, getHypothesisByIdeaId, updateAllHypothesesWeights } = useHypotheses(user, currentCompany, []);
  const { ideas, isLoading: ideasLoading, addIdea, editIdea, deleteIdea, getIdeaById } = useIdeas(user, currentCompany, hypotheses);
  const { experiments, isLoading: experimentsLoading, addExperiment, editExperiment, deleteExperiment, getExperimentByHypothesisId, addExperimentNote, deleteExperimentNote } = useExperiments(user, currentCompany);
  const { departments, loading: departmentsLoading, getDepartmentById, refetch: refreshDepartments } = useDepartments(currentCompany);
  const { categories } = useCategories(currentCompany);
  const { pectiWeights, updatePectiWeights } = usePectiWeights();

  // Utility functions to get all tags and user names
  const getAllTags = (): Tag[] => {
    const tags = new Set<Tag>();
    ideas.forEach(idea => {
      idea.tags?.forEach(tag => tags.add(tag));
    });
    hypotheses.forEach(hypothesis => {
      // Note: Hypothesis type doesn't have tags property, so we skip this
    });
    return Array.from(tags);
  };

  const getAllUserNames = () => {
    const userNames = new Map<string, { id: string, name: string }>();

    ideas.forEach(idea => {
      if (idea.userId && idea.userName) {
        userNames.set(idea.userId, { id: idea.userId, name: idea.userName });
      }
    });

    hypotheses.forEach(hypothesis => {
      if (hypothesis.userId && hypothesis.userName) {
        userNames.set(hypothesis.userId, { id: hypothesis.userId, name: hypothesis.userName });
      }
    });

    experiments.forEach(experiment => {
      if (experiment.userId && experiment.userName) {
        userNames.set(experiment.userId, { id: experiment.userId, name: experiment.userName });
      }
    });

    return Array.from(userNames.values());
  };

  const getExperimentById = (id: string) => experiments.find(e => e.id === id);

  const updateWeights = async (weights: any) => {
    updatePectiWeights(weights);
  };

  const contextValue: AppContextType = {
    // Data
    ideas,
    hypotheses, 
    experiments,
    departments,
    categories: categories.map(cat => cat.name),
    weights: pectiWeights,
    
    // Loading states
    isLoading: ideasLoading || hypothesesLoading || experimentsLoading || departmentsLoading,
    
    // CRUD operations
    addIdea,
    editIdea,
    deleteIdea,
    addHypothesis: async (hypothesis) => {
      await addHypothesis(hypothesis);
      return null; // Adjust return type to match interface
    },
    editHypothesis,
    deleteHypothesis,
    addExperiment: async (experiment) => {
      await addExperiment(experiment);
      return null; // Adjust return type to match interface
    },
    editExperiment,
    deleteExperiment,
    
    // Experiment notes
    addExperimentNote,
    deleteExperimentNote,
    
    // PECTI weights
    updateWeights,
    pectiWeights,
    updatePectiWeights,
    updateAllHypothesesWeights,
    
    // Getters
    getIdeaById,
    getHypothesisById,
    getExperimentById,
    getDepartmentById,
    getHypothesisByIdeaId,
    getExperimentByHypothesisId,
    
    // Utility functions
    getAllTags,
    getAllUserNames,
    
    // Refresh function
    refreshDepartments
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
