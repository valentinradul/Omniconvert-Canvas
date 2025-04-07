
import React, { createContext, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppContextType } from './types';
import { useDepartments } from './useDepartments';
import { useIdeas } from './useIdeas';
import { useHypotheses } from './useHypotheses';
import { useExperiments } from './useExperiments';
import { useCategories } from './useCategories';
import { extractAllTags, extractAllUserNames } from './utils';

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Create a provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const {
    ideas,
    addIdea,
    editIdea,
    deleteIdea,
    getIdeaById
  } = useIdeas(user);
  
  const {
    hypotheses,
    addHypothesis,
    editHypothesis,
    deleteHypothesis,
    getHypothesisById,
    getHypothesisByIdeaId
  } = useHypotheses(user);
  
  const {
    experiments,
    addExperiment,
    editExperiment,
    deleteExperiment,
    getExperimentByHypothesisId,
    getExperimentDuration
  } = useExperiments(user);
  
  const {
    departments,
    addDepartment,
    editDepartment,
    deleteDepartment: rawDeleteDepartment,
    getDepartmentById
  } = useDepartments();
  
  const deleteDepartment = (id: string) => rawDeleteDepartment(id, ideas);
  
  const {
    categories,
    addCategory,
    editCategory,
    deleteCategory
  } = useCategories(ideas);
  
  // Helper function to get all unique tags
  const getAllTags = () => extractAllTags(ideas);
  
  // Helper function to get all unique user names
  const getAllUserNames = () => extractAllUserNames(ideas, hypotheses, experiments);

  return (
    <AppContext.Provider value={{
      departments,
      ideas,
      hypotheses,
      experiments,
      categories,
      addDepartment,
      editDepartment,
      deleteDepartment,
      addIdea,
      editIdea,
      deleteIdea: (id: string) => deleteIdea(id, hypotheses),
      addHypothesis,
      editHypothesis,
      deleteHypothesis: (id: string) => deleteHypothesis(id, experiments),
      addExperiment,
      editExperiment,
      deleteExperiment,
      getIdeaById,
      getHypothesisByIdeaId,
      getHypothesisById,
      getExperimentByHypothesisId,
      getDepartmentById,
      getAllTags,
      getAllUserNames,
      getExperimentDuration,
      addCategory,
      editCategory,
      deleteCategory
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
