
import { GrowthIdea, Hypothesis, Experiment, Department, Category, Tag, PectiWeights } from '@/types';

export interface AppContextType {
  // Data
  ideas: GrowthIdea[];
  hypotheses: Hypothesis[];
  experiments: Experiment[];
  departments: Department[];
  categories: Category[];
  weights: PectiWeights;
  
  // Loading state
  isLoading: boolean;
  
  // CRUD operations
  addIdea: (idea: Omit<GrowthIdea, 'id' | 'createdAt'>) => Promise<GrowthIdea | null>;
  editIdea: (id: string, idea: Partial<GrowthIdea>) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  
  addHypothesis: (hypothesis: Omit<Hypothesis, 'id' | 'createdAt'>) => Promise<Hypothesis | null>;
  editHypothesis: (id: string, hypothesis: Partial<Hypothesis>) => Promise<void>;
  deleteHypothesis: (id: string) => Promise<void>;
  
  addExperiment: (experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Experiment | null>;
  editExperiment: (id: string, experiment: Partial<Experiment>) => Promise<void>;
  deleteExperiment: (id: string) => Promise<void>;
  
  updateWeights: (weights: PectiWeights) => Promise<void>;
  
  // Getters
  getIdeaById: (id: string) => GrowthIdea | undefined;
  getHypothesisById: (id: string) => Hypothesis | undefined;
  getExperimentById: (id: string) => Experiment | undefined;
  getDepartmentById: (id: string) => Department | undefined;
  
  // Utility functions
  getAllTags: () => Tag[];
  getAllUserNames: () => { id: string; name: string }[];
  
  // Refresh function
  refreshDepartments?: () => Promise<void>;
}
