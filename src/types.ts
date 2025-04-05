
// Common types used across the application

export type Department = {
  id: string;
  name: string;
};

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
};

export type PECTI = {
  potential: 1 | 2 | 3 | 4 | 5;
  ease: 1 | 2 | 3 | 4 | 5;
  cost: 1 | 2 | 3 | 4 | 5;
  time: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
};

export type Hypothesis = {
  id: string;
  ideaId: string;
  observation: string;
  initiative: string;
  metric: string;
  pectiScore: PECTI;
  createdAt: Date;
};

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
  createdAt: Date;
  updatedAt: Date;
};
