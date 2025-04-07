// Add missing types required by GrowthIdea & Experiment
export interface GrowthIdea {
  id: string;
  title: string;
  description?: string;
  category?: string;
  departmentId: string;
  createdAt: Date;
  userId?: string;
  userName?: string;
  tags?: string[];
  responsibleUserId?: string;
}

export interface Experiment {
  id: string;
  hypothesisId: string;
  createdAt: Date;
  updatedAt: Date;
  statusUpdatedAt: Date;
  userId?: string;
  userName?: string;
  status?: ExperimentStatus;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  observationContent?: any;
  totalCost?: number;
  totalReturn?: number;
  responsibleUserId?: string;
}

// Add missing team-related types as stubs
export interface TeamMemberFormData {
  name?: string;
  email: string;
  role: string;
  departmentVisibility?: string;
  visibleDepartments?: string[];
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamMemberRole;
  departmentVisibility: DepartmentVisibility;
  visibleDepartments?: string[];
}

export type TeamMemberRole = "admin" | "member" | "viewer";
export type DepartmentVisibility = "all" | "selected" | "none";

export const ALL_DEPARTMENT_VISIBILITY_OPTIONS = ["all", "selected", "none"] as const;

export type Category =
  | "Outreach"
  | "Paid Ads"
  | "Events"
  | "Onboarding"
  | "Product-led"
  | "Content Marketing"
  | "SEO"
  | "Partnerships"
  | "Other";

export interface Department {
  id: string;
  name: string;
}

export interface Hypothesis {
  id: string;
  ideaId: string;
  createdAt: Date;
  userId?: string;
  userName?: string;
  observation: string;
  hypothesis: string;
  initiative: string;
  metric: string;
  target: string;
  status: HypothesisStatus;
  confidenceScore: number;
  easeScore: number;
  impactScore: number;
  confidence: number;
  ease: number;
  impact: number;
  userIdResponsible?: string;
  pectiScore: PECTI;
}

export type HypothesisStatus =
  | "Backlog"
  | "Selected For Testing"
  | "Testing"
  | "Completed"
  | "On Hold"
  | "Rejected";

export type ExperimentStatus =
  | "Planned"
  | "Running"
  | "Paused"
  | "Completed"
  | "Winning"
  | "Losing"
  | "Inconclusive";

export interface PECTI {
  potential: number;
  expense: number;
  confidence: number;
  time: number;
  impact: number;
}

export type Tag = string;

export const calculatePectiPercentage = (pecti: PECTI): number => {
  const { potential, expense, confidence, time, impact } = pecti;
  const totalScore = potential + expense + confidence + time + impact;
  const maxTotalScore = 5 * 10; // Assuming each category is rated out of 10
  return (totalScore / maxTotalScore) * 100;
};
