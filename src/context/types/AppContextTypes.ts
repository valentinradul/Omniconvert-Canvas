
import { Department, GrowthIdea, Hypothesis, Experiment, HypothesisStatus, Tag, PECTIWeights } from '@/types';
import { Category } from '@/services/categoriesService';
import { CompanyRole } from '@/types';

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

// Updated company context types to include department permissions
export type CompanyContextType = {
  companies: any[];
  currentCompany: any | null;
  userCompanyRole: CompanyRole | null;
  companyMembers: any[];
  companyInvitations: any[];
  userIncomingInvitations: any[];
  pendingInvitations: any[];
  isLoading: boolean;
  createCompany: (name: string) => Promise<void>;
  switchCompany: (companyId: string) => void;
  inviteMember: (email: string, role: CompanyRole, departmentPermissions?: { all: boolean; departmentIds: string[] }) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: CompanyRole) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  unsendInvitation: (invitationId: string) => Promise<void>;
  refreshPendingInvitations: () => Promise<void>;
  refreshCompanyMembers: () => Promise<void>;
  refreshUserCompanies: () => Promise<void>;
  refreshUserIncomingInvitations: () => Promise<void>;
};
