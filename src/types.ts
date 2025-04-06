// Common types used across the application

export type Department = {
  id: string;
  name: string;
};

export type Tag = string;

export type Category = string;

export type GrowthIdea = {
  id: string;
  title: string;
  description: string;
  category: Category;
  departmentId: string;
  createdAt: Date;
  userId?: string;
  userName?: string;
  tags?: Tag[];
  responsibleUserId?: string;
};

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

export type Hypothesis = {
  id: string;
  ideaId: string;
  observation: string;
  observationContent?: ObservationContent;
  initiative: string;
  metric: string;
  pectiScore: PECTI;
  createdAt: Date;
  userId?: string;
  userName?: string;
  status?: HypothesisStatus;
  responsibleUserId?: string;
};

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

export type Experiment = {
  id: string;
  hypothesisId: string;
  startDate: Date | null;
  endDate: Date | null;
  status: ExperimentStatus;
  notes: string;
  observationContent?: ObservationContent;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  userName?: string;
  responsibleUserId?: string;
  statusUpdatedAt?: Date;
};

export const calculatePectiPercentage = (pectiScore: PECTI): number => {
  const { potential, ease, cost, time, impact } = pectiScore;
  const totalScore = potential + ease + cost + time + impact;
  const maxPossibleScore = 25; // 5 points max for each of the 5 categories
  return Math.round((totalScore / maxPossibleScore) * 100);
};

export type TeamMemberRole = "Admin" | "Manager" | "Team Member";

export const ALL_TEAM_MEMBER_ROLES: TeamMemberRole[] = [
  "Admin",
  "Manager",
  "Team Member"
];

export type DepartmentVisibility = "Own Department" | "Selected Departments" | "All Departments";

export const ALL_DEPARTMENT_VISIBILITY_OPTIONS: DepartmentVisibility[] = [
  "Own Department", 
  "Selected Departments", 
  "All Departments"
];

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  department?: string;
  title?: string;
  visibleDepartments?: string[];
  departmentVisibility?: DepartmentVisibility;
  photoUrl?: string;
}

export interface TeamMemberFormData {
  name: string;
  email: string;
  role: TeamMemberRole;
  department?: string;
  title?: string;
  visibleDepartments?: string[];
  departmentVisibility?: DepartmentVisibility;
  photoUrl?: string;
}
