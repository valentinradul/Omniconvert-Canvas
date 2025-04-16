
import { ObservationContent } from './common';

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
