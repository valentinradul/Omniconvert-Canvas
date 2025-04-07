
import { GrowthIdea, Hypothesis, Experiment, Tag } from '@/types';

// Generate random ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Get initial data from localStorage or provide defaults
export const getInitialData = <T>(key: string, defaultValue: T): T => {
  const savedData = localStorage.getItem(key);
  if (savedData) {
    try {
      return JSON.parse(savedData) as T;
    } catch (error) {
      console.error(`Error parsing ${key} data from localStorage:`, error);
      return defaultValue;
    }
  }
  return defaultValue;
};

// Calculate experiment duration
export const calculateExperimentDuration = (experiment: Experiment) => {
  const today = new Date();
  const startDate = experiment.startDate ? new Date(experiment.startDate) : new Date(experiment.createdAt);
  const endDate = experiment.endDate ? new Date(experiment.endDate) : null;
  
  // Calculate days running
  const daysRunning = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate days remaining if end date is set
  const daysRemaining = endDate ? Math.max(0, Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))) : null;
  
  // Calculate days total if end date is set
  const daysTotal = endDate ? Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
  
  // Calculate days in current status
  const statusDate = experiment.statusUpdatedAt ? new Date(experiment.statusUpdatedAt) : new Date(experiment.createdAt);
  const daysInStatus = Math.floor((today.getTime() - statusDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    daysRunning,
    daysRemaining,
    daysTotal,
    daysInStatus
  };
};

// Extract all unique tags from ideas
export const extractAllTags = (ideas: GrowthIdea[]): Tag[] => {
  const tagsSet = new Set<Tag>();
  ideas.forEach(idea => {
    if (idea.tags) {
      idea.tags.forEach(tag => {
        tagsSet.add(tag);
      });
    }
  });
  return Array.from(tagsSet);
};

// Extract all user names from various entities
export const extractAllUserNames = (
  ideas: GrowthIdea[], 
  hypotheses: Hypothesis[], 
  experiments: Experiment[]
): { id: string; name: string }[] => {
  const usersMap = new Map<string, string>();
  
  // Add users from ideas
  ideas.forEach(idea => {
    if (idea.userId && idea.userName) {
      usersMap.set(idea.userId, idea.userName);
    }
  });
  
  // Add users from hypotheses
  hypotheses.forEach(hypothesis => {
    if (hypothesis.userId && hypothesis.userName) {
      usersMap.set(hypothesis.userId, hypothesis.userName);
    }
  });
  
  // Add users from experiments
  experiments.forEach(experiment => {
    if (experiment.userId && experiment.userName) {
      usersMap.set(experiment.userId, experiment.userName);
    }
  });
  
  return Array.from(usersMap.entries()).map(([id, name]) => ({ id, name }));
};
