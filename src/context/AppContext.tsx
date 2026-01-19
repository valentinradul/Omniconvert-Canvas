
import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useCompany } from './company/CompanyContext';
import { useDepartments } from './hooks/useDepartments';
import { useIdeas } from './hooks/useIdeas';
import { useHypotheses } from './hooks/useHypotheses';
import { useExperiments } from './hooks/useExperiments';
import { usePectiWeights } from './hooks/usePectiWeights';
import { useCategories } from './hooks/useCategories';
import { getAllTags, getAllUserNames } from './utils/dataUtils';
import { AppContextType } from './types/AppContextTypes';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  // Initialize our hooks
  const { 
    experiments, 
    archivedExperiments,
    isLoading: experimentsLoading,
    isLoadingArchived: isLoadingArchivedExperiments,
    addExperiment, 
    editExperiment, 
    deleteExperiment,
    archiveExperiment,
    unarchiveExperiment,
    loadArchivedExperiments,
    getExperimentByHypothesisId, 
    addExperimentNote, 
    deleteExperimentNote 
  } = useExperiments(user, currentCompany);
  
  const { 
    hypotheses, 
    archivedHypotheses,
    isLoading: hypothesesLoading,
    isLoadingArchived: isLoadingArchivedHypotheses,
    addHypothesis, 
    editHypothesis, 
    deleteHypothesis,
    archiveHypothesis,
    unarchiveHypothesis,
    loadArchivedHypotheses,
    updateAllHypothesesWeights: updateAllHypothesesWeightsBase, 
    getHypothesisByIdeaId, 
    getHypothesisById 
  } = useHypotheses(user, currentCompany, experiments);
  
  const { ideas, archivedIdeas, isLoading: ideasLoading, isLoadingArchived, addIdea, editIdea, deleteIdea, archiveIdea, unarchiveIdea, loadArchivedIdeas, getIdeaById } = 
    useIdeas(user, currentCompany, hypotheses);
  
  const { departments, addDepartment, editDepartment, deleteDepartment, getDepartmentById } = 
    useDepartments(currentCompany);
  
  const { pectiWeights, updatePectiWeights } = usePectiWeights();
  
  const { categories } = useCategories(currentCompany);
  const { companyMembers } = useCompany();
  
  // Create wrapper functions that have access to all hooks
  const allItems = [...ideas, ...hypotheses, ...experiments];
  
  const wrappedDeleteDepartment = (id: string) => {
    deleteDepartment(id, ideas);
  };
  
  const updateAllHypothesesWeights = () => {
    updateAllHypothesesWeightsBase(pectiWeights);
  };

  // Get all user names from company members instead of just from created items
  const getAllActiveUserNames = () => {
    if (!companyMembers || companyMembers.length === 0) {
      // Fallback to items if no company members are loaded
      return getAllUserNames(allItems);
    }
    
    return companyMembers.map(member => ({
      id: member.userId,
      name: member.profile?.fullName || member.userId
    }));
  };

  const isLoading = ideasLoading || hypothesesLoading || experimentsLoading;
  
  const appContextValue: AppContextType = {
    departments,
    categories,
    ideas,
    archivedIdeas,
    hypotheses,
    archivedHypotheses,
    experiments,
    archivedExperiments,
    pectiWeights,
    isLoading,
    isLoadingArchived,
    isLoadingArchivedHypotheses,
    isLoadingArchivedExperiments,
    addDepartment,
    editDepartment,
    deleteDepartment: wrappedDeleteDepartment,
    addIdea,
    editIdea,
    deleteIdea,
    archiveIdea,
    unarchiveIdea,
    loadArchivedIdeas,
    addHypothesis,
    editHypothesis,
    deleteHypothesis,
    archiveHypothesis,
    unarchiveHypothesis,
    loadArchivedHypotheses,
    addExperiment,
    editExperiment,
    deleteExperiment,
    archiveExperiment,
    unarchiveExperiment,
    loadArchivedExperiments,
    addExperimentNote,
    deleteExperimentNote,
    updatePectiWeights,
    updateAllHypothesesWeights,
    getIdeaById,
    getHypothesisByIdeaId,
    getHypothesisById,
    getExperimentByHypothesisId,
    getDepartmentById,
    getAllTags: () => getAllTags(ideas),
    getAllUserNames: getAllActiveUserNames
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
