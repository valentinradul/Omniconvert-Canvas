// Common types used across the application

export type Department = {
  id: string;
  name: string;
};

export type Tag = string;

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
  companyId?: string;
  isPublic?: boolean;
};

export type PECTI = {
  potential: 1 | 2 | 3 | 4 | 5;
  ease: 1 | 2 | 3 | 4 | 5;
  cost: 1 | 2 | 3 | 4 | 5;
  time: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
};

export type PECTIWeights = {
  potential: number;
  ease: number;
  cost: number;
  time: number;
  impact: number;
};

// Default weights based on specified percentages:
// Potential - 25%, Ease - 15%, Cost - 15%, Time - 10%, Impact - 35%
export const DEFAULT_PECTI_WEIGHTS: PECTIWeights = {
  potential: 2.5,
  ease: 1.5,
  cost: 1.5,
  time: 1.0,
  impact: 3.5
};

// Extended type for observation content that supports text, URLs, and images
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
  companyId?: string;
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
  companyId?: string;
};

// Define the CompanyRole type
export type CompanyRole = 'owner' | 'admin' | 'member';

// Company-related types
export type Company = {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
};

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyRole;
  createdAt: Date;
  profile?: {
    fullName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface CompanyInvitation {
  id: string;
  companyId: string;
  email: string;
  role: CompanyRole;
  accepted: boolean;
  invitedBy: string;
  createdAt: Date;
}

// Helper function to calculate PECTI percentage score with weights
export const calculatePectiPercentage = (
  pectiScore: PECTI, 
  weights: PECTIWeights = DEFAULT_PECTI_WEIGHTS
): number => {
  const { potential, ease, cost, time, impact } = pectiScore;
  const { potential: potentialWeight, ease: easeWeight, cost: costWeight, time: timeWeight, impact: impactWeight } = weights;
  
  // Calculate the sum of weighted scores
  const weightedTotal = 
    potential * potentialWeight + 
    ease * easeWeight + 
    cost * costWeight + 
    time * timeWeight + 
    impact * impactWeight;
  
  // Calculate the maximum possible weighted score
  const maxWeightedScore = 
    5 * potentialWeight + 
    5 * easeWeight + 
    5 * costWeight + 
    5 * timeWeight + 
    5 * impactWeight;
  
  return Math.round((weightedTotal / maxWeightedScore) * 100);
};
