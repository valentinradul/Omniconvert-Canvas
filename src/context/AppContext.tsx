
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Company, Hypothesis, GrowthIdea, Experiment, PECTIWeights, Tag, HypothesisStatus, PECTI } from '@/types';
import { useCompany } from './company/CompanyContext';
import { useCategories } from './hooks/useCategories';
import { useDepartments } from './hooks/useDepartments';
import { useIdeas } from './hooks/useIdeas';
import { useHypotheses } from './hooks/useHypotheses';
import { useExperiments } from './hooks/useExperiments';
import { usePectiWeights } from './hooks/usePectiWeights';

interface Department {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
}

interface AppContextType {
  departments: Department[];
  categories: any[];
  ideas: GrowthIdea[];
  hypotheses: Hypothesis[];
  experiments: Experiment[];
  pectiWeights: PECTIWeights;
  isLoading: boolean;
  fetchDepartments: () => Promise<void>;
  addDepartment: (name: string) => Promise<void>;
  editDepartment: (id: string, name: string) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  addIdea: (idea: Omit<GrowthIdea, 'id' | 'createdAt'>) => Promise<GrowthIdea | null>;
  editIdea: (id: string, idea: Partial<GrowthIdea>) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  addHypothesis: (hypothesis: Omit<Hypothesis, 'id' | 'createdAt'>) => Promise<void>;
  editHypothesis: (id: string, hypothesis: Partial<Hypothesis>) => Promise<void>;
  deleteHypothesis: (id: string) => Promise<void>;
  addExperiment: (experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editExperiment: (id: string, experiment: Partial<Experiment>) => Promise<void>;
  deleteExperiment: (id: string) => Promise<void>;
  addExperimentNote: (experimentId: string, noteContent: string) => Promise<void>;
  deleteExperimentNote: (experimentId: string, noteId: string) => Promise<void>;
  updatePectiWeights: (weights: Partial<PECTIWeights>) => void;
  updateAllHypothesesWeights: () => void;
  getIdeaById: (id: string) => GrowthIdea | undefined;
  getHypothesisByIdeaId: (ideaId: string) => Hypothesis | undefined;
  getHypothesisById: (id: string) => Hypothesis | undefined;
  getExperimentByHypothesisId: (hypothesisId: string) => Experiment | undefined;
  getDepartmentById: (id: string) => Department | undefined;
  getAllTags: () => Tag[];
  getAllUserNames: () => {id: string; name: string}[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentCompany, userCompanyRole } = useCompany();
  const { user } = useAuth();

  // Use existing hooks
  const { categories } = useCategories(currentCompany);
  const { departments, addDepartment, editDepartment, deleteDepartment, refetch: fetchDepartments } = useDepartments(currentCompany);
  const { ideas, addIdea, editIdea, deleteIdea, getIdeaById, getAllTags, getAllUserNames } = useIdeas(user, currentCompany);
  const { hypotheses, addHypothesis, editHypothesis, deleteHypothesis, getHypothesisByIdeaId, getHypothesisById } = useHypotheses(user, currentCompany, []);
  const { experiments, addExperiment, editExperiment, deleteExperiment, addExperimentNote, deleteExperimentNote, getExperimentByHypothesisId } = useExperiments(user, currentCompany);
  const { pectiWeights, updatePectiWeights, updateAllHypothesesWeights } = usePectiWeights();

  const [isLoading, setIsLoading] = useState(false);

  const getDepartmentById = useCallback((id: string) => {
    const department = departments.find(d => d.id === id);
    console.log('Looking for department with ID:', id, 'found:', department);
    return department;
  }, [departments]);

  return (
    <AppContext.Provider
      value={{
        departments,
        categories,
        ideas,
        hypotheses,
        experiments,
        pectiWeights,
        isLoading,
        fetchDepartments,
        addDepartment,
        editDepartment,
        deleteDepartment,
        addIdea,
        editIdea,
        deleteIdea,
        addHypothesis,
        editHypothesis,
        deleteHypothesis,
        addExperiment,
        editExperiment,
        deleteExperiment,
        addExperimentNote,
        deleteExperimentNote,
        updatePectiWeights,
        updateAllHypothesesWeights,
        getIdeaById,
        getHypothesisByIdeaId,
        getHypothesisById,
        getExperimentByHypothesisId,
        getDepartmentById,
        getAllTags,
        getAllUserNames
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within a AppProvider');
  }
  return context;
};
