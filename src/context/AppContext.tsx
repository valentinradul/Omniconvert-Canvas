import React, { createContext, useContext, useState, useEffect } from 'react';
import { Department, GrowthIdea, Hypothesis, Experiment, HypothesisStatus, Tag, Category } from '../types';
import { useAuth } from './AuthContext';

// Define the shape of our context
type AppContextType = {
  departments: Department[];
  ideas: GrowthIdea[];
  hypotheses: Hypothesis[];
  experiments: Experiment[];
  categories: Category[];
  addDepartment: (name: string) => void;
  editDepartment: (id: string, name: string) => void;
  deleteDepartment: (id: string) => void;
  addIdea: (idea: Omit<GrowthIdea, 'id' | 'createdAt'>) => void;
  editIdea: (id: string, idea: Partial<GrowthIdea>) => void;
  deleteIdea: (id: string) => void;
  addHypothesis: (hypothesis: Omit<Hypothesis, 'id' | 'createdAt'>) => void;
  editHypothesis: (id: string, hypothesis: Partial<Hypothesis>) => void;
  deleteHypothesis: (id: string) => void;
  addExperiment: (experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt' | 'statusUpdatedAt'>) => void;
  editExperiment: (id: string, experiment: Partial<Experiment>) => void;
  deleteExperiment: (id: string) => void;
  getIdeaById: (id: string) => GrowthIdea | undefined;
  getHypothesisByIdeaId: (ideaId: string) => Hypothesis | undefined;
  getHypothesisById: (id: string) => Hypothesis | undefined;
  getExperimentByHypothesisId: (hypothesisId: string) => Experiment | undefined;
  getDepartmentById: (id: string) => Department | undefined;
  getAllTags: () => Tag[];
  getAllUserNames: () => {id: string; name: string}[];
  getExperimentDuration: (experiment: Experiment) => { 
    daysRunning: number;
    daysRemaining: number | null; 
    daysInStatus: number;
    daysTotal: number | null;
  };
  addCategory: (category: Category) => void;
  editCategory: (oldCategory: Category, newCategory: Category) => void;
  deleteCategory: (category: Category) => void;
};

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Get stored data from localStorage or use default values
const getInitialData = <T extends unknown>(key: string, defaultValue: T): T => {
  const storedValue = localStorage.getItem(key);
  return storedValue ? JSON.parse(storedValue) : defaultValue;
};

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Create a provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>(() => 
    getInitialData('departments', [
      { id: generateId(), name: 'Marketing' },
      { id: generateId(), name: 'Sales' },
      { id: generateId(), name: 'Product' }
    ])
  );
  
  const [ideas, setIdeas] = useState<GrowthIdea[]>(() => 
    getInitialData('ideas', [])
  );
  
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(() => 
    getInitialData('hypotheses', [])
  );
  
  const [experiments, setExperiments] = useState<Experiment[]>(() => 
    getInitialData('experiments', [])
  );
  
  const [categories, setCategories] = useState<Category[]>(() =>
    getInitialData('categories', [
      "Outreach", 
      "Paid Ads", 
      "Events", 
      "Onboarding", 
      "Product-led", 
      "Content Marketing",
      "SEO",
      "Partnerships",
      "Other"
    ])
  );
  
  // Update localStorage when state changes
  useEffect(() => {
    localStorage.setItem('departments', JSON.stringify(departments));
  }, [departments]);
  
  useEffect(() => {
    localStorage.setItem('ideas', JSON.stringify(ideas));
  }, [ideas]);
  
  useEffect(() => {
    localStorage.setItem('hypotheses', JSON.stringify(hypotheses));
  }, [hypotheses]);
  
  useEffect(() => {
    localStorage.setItem('experiments', JSON.stringify(experiments));
  }, [experiments]);
  
  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);
  
  // Helper function to get all unique tags
  const getAllTags = (): Tag[] => {
    const tagsSet = new Set<Tag>();
    
    ideas.forEach(idea => {
      if (idea.tags) {
        idea.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    
    return Array.from(tagsSet);
  };
  
  // Helper function to get all unique user names
  const getAllUserNames = () => {
    const usersMap = new Map<string, string>();
    
    [...ideas, ...hypotheses, ...experiments].forEach(item => {
      if (item.userId && item.userName) {
        usersMap.set(item.userId, item.userName);
      }
    });
    
    return Array.from(usersMap.entries()).map(([id, name]) => ({ id, name }));
  };
  
  // Helper function to calculate experiment durations and days in status
  const getExperimentDuration = (experiment: Experiment) => {
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
  
  // Department CRUD operations
  const addDepartment = (name: string) => {
    setDepartments([...departments, { id: generateId(), name }]);
  };
  
  const editDepartment = (id: string, name: string) => {
    setDepartments(departments.map(dept => 
      dept.id === id ? { ...dept, name } : dept
    ));
  };
  
  const deleteDepartment = (id: string) => {
    // Check if any ideas are using this department
    const ideasUsingDepartment = ideas.some(idea => idea.departmentId === id);
    
    if (ideasUsingDepartment) {
      alert('Cannot delete department that has ideas associated with it.');
      return;
    }
    
    setDepartments(departments.filter(dept => dept.id !== id));
  };
  
  // Growth Idea CRUD operations
  const addIdea = (idea: Omit<GrowthIdea, 'id' | 'createdAt'>) => {
    setIdeas([
      ...ideas,
      {
        ...idea,
        id: generateId(),
        createdAt: new Date(),
        userId: user?.id || undefined,
        userName: user?.user_metadata?.full_name || user?.email || undefined
      }
    ]);
  };
  
  const editIdea = (id: string, ideaUpdates: Partial<GrowthIdea>) => {
    setIdeas(ideas.map(idea => 
      idea.id === id ? { ...idea, ...ideaUpdates } : idea
    ));
  };
  
  const deleteIdea = (id: string) => {
    // Check if any hypotheses are associated with this idea
    const hypothesisWithIdea = hypotheses.find(h => h.ideaId === id);
    
    if (hypothesisWithIdea) {
      alert('Cannot delete idea that has a hypothesis associated with it.');
      return;
    }
    
    setIdeas(ideas.filter(idea => idea.id !== id));
  };
  
  // Hypothesis CRUD operations
  const addHypothesis = (hypothesis: Omit<Hypothesis, 'id' | 'createdAt'>) => {
    setHypotheses([
      ...hypotheses,
      {
        ...hypothesis,
        id: generateId(),
        createdAt: new Date(),
        status: hypothesis.status || 'Backlog',
        userId: hypothesis.userId || user?.id,
        userName: hypothesis.userName || user?.user_metadata?.full_name || user?.email
      }
    ]);
  };
  
  const editHypothesis = (id: string, hypothesisUpdates: Partial<Hypothesis>) => {
    setHypotheses(hypotheses.map(hypothesis => 
      hypothesis.id === id ? { ...hypothesis, ...hypothesisUpdates } : hypothesis
    ));
  };
  
  const deleteHypothesis = (id: string) => {
    // Check if any experiments are associated with this hypothesis
    const experimentWithHypothesis = experiments.find(e => e.hypothesisId === id);
    
    if (experimentWithHypothesis) {
      alert('Cannot delete hypothesis that has an experiment associated with it.');
      return;
    }
    
    setHypotheses(hypotheses.filter(hypothesis => hypothesis.id !== id));
  };
  
  // Experiment CRUD operations
  const addExperiment = (experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt' | 'statusUpdatedAt'>) => {
    const now = new Date();
    setExperiments([
      ...experiments,
      {
        ...experiment,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        statusUpdatedAt: now,
        userId: experiment.userId || user?.id,
        userName: experiment.userName || user?.user_metadata?.full_name || user?.email
      }
    ]);
  };
  
  const editExperiment = (id: string, experimentUpdates: Partial<Experiment>) => {
    const now = new Date();
    
    setExperiments(experiments.map(experiment => {
      if (experiment.id !== id) return experiment;
      
      // If status is changing, update statusUpdatedAt
      const statusIsChanging = experimentUpdates.status && experiment.status !== experimentUpdates.status;
      
      return {
        ...experiment,
        ...experimentUpdates,
        updatedAt: now,
        statusUpdatedAt: statusIsChanging ? now : experiment.statusUpdatedAt || experiment.createdAt
      };
    }));
  };
  
  const deleteExperiment = (id: string) => {
    setExperiments(experiments.filter(experiment => experiment.id !== id));
  };
  
  // Category CRUD operations
  const addCategory = (category: Category) => {
    setCategories([...categories, category]);
  };
  
  const editCategory = (oldCategory: Category, newCategory: Category) => {
    // Update the categories list
    setCategories(categories.map(cat => cat === oldCategory ? newCategory : cat));
    
    // Update any ideas that use the old category
    setIdeas(ideas.map(idea => 
      idea.category === oldCategory 
        ? { ...idea, category: newCategory } 
        : idea
    ));
  };
  
  const deleteCategory = (category: Category) => {
    // Check if any ideas are using this category
    const ideasUsingCategory = ideas.some(idea => idea.category === category);
    
    if (ideasUsingCategory) {
      alert('Cannot delete category that has ideas associated with it.');
      return;
    }
    
    setCategories(categories.filter(cat => cat !== category));
  };
  
  // Getter functions
  const getIdeaById = (id: string) => ideas.find(idea => idea.id === id);
  const getHypothesisByIdeaId = (ideaId: string) => hypotheses.find(h => h.ideaId === ideaId);
  const getHypothesisById = (id: string) => hypotheses.find(h => h.id === id);
  const getExperimentByHypothesisId = (hypothesisId: string) => experiments.find(e => e.hypothesisId === hypothesisId);
  const getDepartmentById = (id: string) => departments.find(d => d.id === id);
  
  return (
    <AppContext.Provider value={{
      departments,
      ideas,
      hypotheses,
      experiments,
      categories,
      addDepartment,
      editDepartment,
      deleteDepartment,
      addIdea,
      editIdea,
      deleteIdea,
      addHypothesis,
      editHypothesis,
      deleteHypothesis,
      addExperiment,
      editExperiment,
      deleteExperiment,
      getIdeaById,
      getHypothesisByIdeaId,
      getHypothesisById,
      getExperimentByHypothesisId,
      getDepartmentById,
      getAllTags,
      getAllUserNames,
      getExperimentDuration,
      addCategory,
      editCategory,
      deleteCategory
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
