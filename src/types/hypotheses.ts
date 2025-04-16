
import { ObservationContent } from './common';
import { PECTI } from './pecti';

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
