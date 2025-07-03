
import { Department, GrowthIdea, Hypothesis, Experiment, HypothesisStatus, Tag, PECTIWeights } from '@/types';
import { Category } from '@/services/categoriesService';

export type AppContextType = {
  departments: Department[];
  categories: Category[];
  ideas: GrowthIdea[];
  hypotheses: Hypothesis[];
  experiments: Experiment[];
  pectiWeights: PECTIWeights;
  isLoading: boolean;
  addDepartment: (name: string) => void;
  editDepartment: (id: string, name: string) => void;
  deleteDepartment: (id: string) => void;
  addIdea: (idea: Omit<GrowthIdea, 'id' | 'createdAt'>) => Promise<GrowthIdea | null>;
  editIdea: (id: string, idea: Partial<GrowthIdea>) => void;
  deleteIdea: (id: string) => void;
  addHypothesis: (hypothesis: Omit<Hypothesis, 'id' | 'createdAt'>) => void;
  editHypothesis: (id: string, hypothesis: Partial<Hypothesis>) => void;
  deleteHypothesis: (id: string) => void;
  addExperiment: (experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editExperiment: (id: string, experiment: Partial<Experiment>) => void;
  deleteExperiment: (id: string) => void;
  addExperimentNote: (experimentId: string, noteContent: string) => void;
  deleteExperimentNote: (experimentId: string, noteId: string) => void;
  updatePectiWeights: (weights: Partial<PECTIWeights>) => void;
  updateAllHypothesesWeights: () => void;
  getIdeaById: (id: string) => GrowthIdea | undefined;
  getHypothesisByIdeaId: (ideaId: string) => Hypothesis | undefined;
  getHypothesisById: (id: string) => Hypothesis | undefined;
  getExperimentByHypothesisId: (hypothesisId: string) => Experiment | undefined;
  getDepartmentById: (id: string) => Department | undefined;
  getAllTags: () => Tag[];
  getAllUserNames: () => {id: string; name: string}[];
};
