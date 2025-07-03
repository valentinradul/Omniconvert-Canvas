
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

export interface ExperimentNote {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  author_name: string;
}

export type Experiment = {
  id: string;
  hypothesisId: string;
  startDate: Date | null;
  endDate: Date | null;
  status: ExperimentStatus;
  notes: string; // Keep for backward compatibility
  notes_history: ExperimentNote[]; // New structured notes
  observationContent?: ObservationContent;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  userName?: string;
  companyId?: string;
};
