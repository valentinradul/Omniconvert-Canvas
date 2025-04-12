
import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';
import { useDepartments } from './hooks/useDepartments';
import { useIdeas } from './hooks/useIdeas';
import { useHypotheses } from './hooks/useHypotheses';
import { useExperiments } from './hooks/useExperiments';
import { usePectiWeights } from './hooks/usePectiWeights';
import { getAllTags, getAllUserNames } from './utils/dataUtils';
import { AppContextType } from './types/AppContextTypes';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  // Initialize our hooks
  const { experiments, addExperiment, editExperiment, deleteExperiment, getExperimentByHypothesisId } = 
    useExperiments(user, currentCompany);
  
  const { hypotheses, addHypothesis, editHypothesis, deleteHypothesis, updateAllHypothesesWeights: updateAllHypothesesWeightsBase, getHypothesisByIdeaId, getHypothesisById } = 
    useHypotheses(user, currentCompany, experiments);
  
  const { ideas, addIdea, editIdea, deleteIdea, getIdeaById } = 
    useIdeas(user, currentCompany, hypotheses);
  
  const { departments, addDepartment, editDepartment, deleteDepartment, getDepartmentById } = 
    useDepartments();
  
  const { pectiWeights, updatePectiWeights } = usePectiWeights();
  
  // Create wrapper functions that have access to all hooks
  const allItems = [...ideas, ...hypotheses, ...experiments];
  
  const wrappedDeleteDepartment = (id: string) => {
    deleteDepartment(id, ideas);
  };
  
  const updateAllHypothesesWeights = () => {
    updateAllHypothesesWeightsBase(pectiWeights);
  };
  
  const appContextValue: AppContextType = {
    departments,
    ideas,
    hypotheses,
    experiments,
    pectiWeights,
    addDepartment,
    editDepartment,
    deleteDepartment: wrappedDeleteDepartment,
    addIdea,
    editIdea,
    deleteIdea,
    addHypothesis,
    editHypothesis,
    deleteHypothesis,
    addExperiment,
    editExperiment,
    deleteExperiment,
    updatePectiWeights,
    updateAllHypothesesWeights,
    getIdeaById,
    getHypothesisByIdeaId,
    getHypothesisById,
    getExperimentByHypothesisId,
    getDepartmentById,
    getAllTags: () => getAllTags(ideas),
    getAllUserNames: () => getAllUserNames(allItems)
  };
  
  return (
    <AppContext.Provider value={appContextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
