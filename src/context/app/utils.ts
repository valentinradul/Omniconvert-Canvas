
import { Department, GrowthIdea, Hypothesis, Experiment, Tag } from '@/types';

// Helper to generate IDs
export const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper function to get all unique tags
export const extractAllTags = (ideas: GrowthIdea[]): Tag[] => {
  const tagsSet = new Set<Tag>();
  
  ideas.forEach(idea => {
    if (idea.tags) {
      idea.tags.forEach(tag => tagsSet.add(tag));
    }
  });
  
  return Array.from(tagsSet);
};

// Helper function to get all unique user names
export const extractAllUserNames = (
  ideas: GrowthIdea[], 
  hypotheses: Hypothesis[], 
  experiments: Experiment[]
) => {
  const usersMap = new Map<string, string>();
  
  [...ideas, ...hypotheses, ...experiments].forEach(item => {
    if (item.userId && item.userName) {
      usersMap.set(item.userId, item.userName);
    }
  });
  
  return Array.from(usersMap.entries()).map(([id, name]) => ({ id, name }));
};

// Helper function to calculate experiment durations and days in status
export const calculateExperimentDuration = (experiment: Experiment) => {
  const today = new Date();
  const createdAt = new Date(experiment.createdAt);
  const statusUpdatedAt = experiment.statusUpdatedAt ? new Date(experiment.statusUpdatedAt) : createdAt;
  const startDate = experiment.startDate ? new Date(experiment.startDate) : null;
  const endDate = experiment.endDate ? new Date(experiment.endDate) : null;
  
  // Calculate days running (from creation or start date, whichever is applicable)
  const daysRunning = startDate 
    ? Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    : Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate days remaining to end date, if applicable
  const daysRemaining = endDate 
    ? Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  // Calculate days in the current status
  const daysInStatus = Math.floor((today.getTime() - statusUpdatedAt.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate total planned days for the experiment
  const daysTotal = startDate && endDate
    ? Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;
    
  return {
    daysRunning,
    daysRemaining, 
    daysInStatus,
    daysTotal
  };
};

// Get stored data from localStorage or use default values
export const getInitialData = <T extends unknown>(key: string, defaultValue: T): T => {
  const storedValue = localStorage.getItem(key);
  return storedValue ? JSON.parse(storedValue) : defaultValue;
};

// Filter data based on company ID
export const filterByCompany = <T extends { company_id?: string }>(
  items: T[], 
  companyId: string | undefined
): T[] => {
  if (!companyId) return items;
  return items.filter(item => !companyId || item.company_id === companyId);
};

// Helper to check if value exists in array
export const itemExists = <T>(arr: T[], id: string, field: keyof T): boolean => {
  return arr.some(item => (item[field] as unknown) === id);
};
