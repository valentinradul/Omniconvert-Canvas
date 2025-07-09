
import { GrowthIdea, Hypothesis, Experiment, Department, PECTIWeights } from '@/types';

export interface AppContextType {
  // Data
  ideas: GrowthIdea[];
  hypotheses: Hypothesis[];
  experiments: Experiment[];
  departments: Department[];
  pectiWeights: PECTIWeights;
  
  // Loading states
  ideasLoading: boolean;
  hypothesesLoading: boolean;
  experimentsLoading: boolean;
  departmentsLoading: boolean;
  weightsLoading: boolean;
  
  // Ideas operations
  addIdea: (idea: Partial<GrowthIdea>) => void;
  editIdea: (id: string, updates: Partial<GrowthIdea>) => void;
  deleteIdea: (id: string) => void;
  getIdeaById: (id: string) => GrowthIdea | undefined;
  
  // Hypotheses operations
  addHypothesis: (hypothesis: Partial<Hypothesis>) => void;
  editHypothesis: (id: string, updates: Partial<Hypothesis>) => void;
  deleteHypothesis: (id: string) => void;
  getHypothesisById: (id: string) => Hypothesis | undefined;
  
  // Experiments operations
  addExperiment: (experiment: Partial<Experiment>) => void;
  editExperiment: (id: string, updates: Partial<Experiment>) => void;
  deleteExperiment: (id: string) => void;
  getExperimentByHypothesisId: (hypothesisId: string) => Experiment | undefined;
  addExperimentNote: (experimentId: string, note: string) => void;
  deleteExperimentNote: (experimentId: string, noteId: string) => void;
  
  // Departments operations
  addDepartment: (name: string) => void;
  editDepartment: (id: string, name: string) => void;
  deleteDepartment: (id: string) => void;
  getDepartmentById: (id: string) => Department | undefined;
  
  // PECTI weights operations
  updatePectiWeights: (weights: Partial<PECTIWeights>) => void;
  
  // Utility functions
  getAllTags: () => string[];
  getAllUserNames: () => { id: string; name: string }[];
}
