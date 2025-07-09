
import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useCompany } from './company/CompanyContext';
import { useViewPreference } from '@/hooks/useViewPreference';
import { useIdeas } from './hooks/useIdeas';
import { useHypotheses } from './hooks/useHypotheses';
import { useExperiments } from './hooks/useExperiments';
import { useDepartments } from './hooks/useDepartments';
import { usePectiWeights } from './hooks/usePectiWeights';
import { AppContextType } from './types/AppContextTypes';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const { viewPreference } = useViewPreference();
  
  const {
    ideas,
    isLoading: ideasLoading,
    addIdea,
    editIdea,
    deleteIdea,
    getIdeaById
  } = useIdeas(user, currentCompany, []);
  
  const {
    hypotheses,
    isLoading: hypothesesLoading,
    addHypothesis,
    editHypothesis,
    deleteHypothesis,
    getHypothesisById
  } = useHypotheses(user, currentCompany);
  
  const {
    experiments,
    isLoading: experimentsLoading,
    addExperiment,
    editExperiment,
    deleteExperiment,
    getExperimentByHypothesisId,
    addExperimentNote,
    deleteExperimentNote
  } = useExperiments(user, currentCompany);
  
  const { departments, loading: departmentsLoading, addDepartment, editDepartment, deleteDepartment, getDepartmentById } = useDepartments(currentCompany, viewPreference);

  const { pectiWeights, updatePectiWeights } = usePectiWeights();

  const getAllTags = () => {
    const tags = new Set<string>();
    ideas.forEach(idea => {
      if (idea.tags) {
        idea.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  };

  const getAllUserNames = () => {
    const users = new Map<string, { id: string; name: string }>();
  
    ideas.forEach(idea => {
      if (idea.userId && idea.userName) {
        users.set(idea.userId, { id: idea.userId, name: idea.userName });
      }
    });
  
    return Array.from(users.values());
  };

  const value: AppContextType = {
    ideas,
    hypotheses,
    experiments,
    departments,
    pectiWeights,
    ideasLoading,
    hypothesesLoading,
    experimentsLoading,
    departmentsLoading,
    weightsLoading: false,
    addIdea,
    editIdea,
    deleteIdea,
    getIdeaById,
    addHypothesis,
    editHypothesis,
    deleteHypothesis,
    getHypothesisById,
    addExperiment,
    editExperiment,
    deleteExperiment,
    getExperimentByHypothesisId,
    addExperimentNote,
    deleteExperimentNote,
    addDepartment,
    editDepartment,
    deleteDepartment,
    getDepartmentById,
    updatePectiWeights,
    getAllTags,
    getAllUserNames
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
