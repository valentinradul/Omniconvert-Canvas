
import { Department, GrowthIdea, Hypothesis, Experiment, HypothesisStatus, Tag, Category, PECTI } from '@/types';

// Define the shape of our context
export type AppContextType = {
  departments: Department[];
  ideas: GrowthIdea[];
  hypotheses: Hypothesis[];
  experiments: Experiment[];
  categories: Category[];
  addDepartment: (name: string) => void;
  editDepartment: (id: string, name: string) => void;
  deleteDepartment: (id: string) => void;
  addIdea: (idea: Omit<GrowthIdea, 'id' | 'createdAt'>) => void;
  editIdea: (id: string, idea: Partial<GrowthIdea>) => void;
  deleteIdea: (id: string) => void;
  addHypothesis: (hypothesis: Omit<Hypothesis, 'id' | 'createdAt'>) => void;
  editHypothesis: (id: string, hypothesis: Partial<Hypothesis>) => void;
  deleteHypothesis: (id: string) => void;
  addExperiment: (experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt' | 'statusUpdatedAt'>) => void;
  editExperiment: (id: string, experiment: Partial<Experiment>) => void;
  deleteExperiment: (id: string) => void;
  getIdeaById: (id: string) => GrowthIdea | undefined;
  getHypothesisByIdeaId: (ideaId: string) => Hypothesis | undefined;
  getHypothesisById: (id: string) => Hypothesis | undefined;
  getExperimentByHypothesisId: (hypothesisId: string) => Experiment | undefined;
  getDepartmentById: (id: string) => Department | undefined;
  getAllTags: () => Tag[];
  getAllUserNames: () => {id: string; name: string}[];
  getExperimentDuration: (experiment: Experiment) => { 
    daysRunning: number;
    daysRemaining: number | null; 
    daysInStatus: number;
    daysTotal: number | null;
  };
  addCategory: (category: Category) => void;
  editCategory: (oldCategory: Category, newCategory: Category) => void;
  deleteCategory: (category: Category) => void;
};
