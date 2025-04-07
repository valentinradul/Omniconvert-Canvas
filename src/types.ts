
// Common types used across the application

export type Department = {
  id: string;
  name: string;
};

export type Tag = string;

export type Category = string;

export interface GrowthIdea {
  id: string;
  title: string;
  description?: string;
  category?: string;
  departmentId?: string;
  userId?: string;
  userName?: string;
  createdAt: Date;
  tags?: Tag[];
  responsibleUserId?: string;
}

export const ALL_CATEGORIES: Category[] = [
  "Outreach",
  "Paid Ads",
  "Events",
  "Onboarding",
  "Product-led",
  "Content Marketing",
  "SEO",
  "Partnerships",
  "Other"
];

export type PECTI = {
  potential: 1 | 2 | 3 | 4 | 5;
  ease: 1 | 2 | 3 | 4 | 5;
  cost: 1 | 2 | 3 | 4 | 5;
  time: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
};

export type ObservationContent = {
  text: string;
  imageUrls?: string[];
  externalUrls?: string[];
};

export interface Hypothesis {
  id: string;
  ideaId?: string;
  observation?: string;
  observationContent?: any;
  initiative?: string;
  metric?: string;
  createdAt: Date;
  status?: HypothesisStatus;
  userId?: string;
  userName?: string;
  pectiScore?: PECTI;
  responsibleUserId?: string;
}

export type HypothesisStatus = 
  | "Backlog"
  | "Selected For Testing"
  | "Testing"
  | "Completed"
  | "Archived";

export const ALL_HYPOTHESIS_STATUSES: HypothesisStatus[] = [
  "Backlog",
  "Selected For Testing",
  "Testing",
  "Completed",
  "Archived"
];

export type ExperimentStatus = 
  | "Planned" 
  | "In Progress" 
  | "Blocked" 
  | "Winning" 
  | "Losing" 
  | "Inconclusive";

export const ALL_STATUSES: ExperimentStatus[] = [
  "Planned",
  "In Progress",
  "Blocked",
  "Winning",
  "Losing",
  "Inconclusive"
];

export interface Experiment {
  id: string;
  hypothesisId: string;
  status?: ExperimentStatus;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  statusUpdatedAt: Date | null;
  totalCost?: number;
  totalReturn?: number;
  userId?: string;
  userName?: string;
  observationContent?: any;
  responsibleUserId?: string;
}

export const calculatePectiPercentage = (pectiScore: PECTI): number => {
  const { potential, ease, cost, time, impact } = pectiScore;
  const totalScore = potential + ease + cost + time + impact;
  const maxPossibleScore = 25; // 5 points max for each of the 5 categories
  return Math.round((totalScore / maxPossibleScore) * 100);
};

// Team Member types (needed for now to prevent TypeScript errors)
export type TeamMemberRole = 'owner' | 'manager' | 'member';
export type DepartmentVisibility = 'Own Department' | 'All Departments' | 'Selected Departments';
export const ALL_DEPARTMENT_VISIBILITY_OPTIONS: DepartmentVisibility[] = [
  'Own Department',
  'All Departments',
  'Selected Departments'
];

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  department?: string;
  title?: string;
  departmentVisibility: DepartmentVisibility;
  visibleDepartments: string[];
  photoUrl?: string;
}

export interface TeamMemberFormData {
  name: string;
  email?: string;
  role: TeamMemberRole;
  department?: string;
  title?: string;
  departmentVisibility: DepartmentVisibility;
  visibleDepartments: string[];
  customMessage?: string;
}
