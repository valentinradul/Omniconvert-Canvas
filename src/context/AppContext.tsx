import React, { createContext, useContext, useState, useEffect } from 'react';
import { Department, GrowthIdea, Hypothesis, Experiment, HypothesisStatus, Tag, PECTIWeights, DEFAULT_PECTI_WEIGHTS } from '../types';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';

type AppContextType = {
  departments: Department[];
  ideas: GrowthIdea[];
  hypotheses: Hypothesis[];
  experiments: Experiment[];
  pectiWeights: PECTIWeights;
  addDepartment: (name: string) => void;
  editDepartment: (id: string, name: string) => void;
  deleteDepartment: (id: string) => void;
  addIdea: (idea: Omit<GrowthIdea, 'id' | 'createdAt'>) => void;
  editIdea: (id: string, idea: Partial<GrowthIdea>) => void;
  deleteIdea: (id: string) => void;
  addHypothesis: (hypothesis: Omit<Hypothesis, 'id' | 'createdAt'>) => void;
  editHypothesis: (id: string, hypothesis: Partial<Hypothesis>) => void;
  deleteHypothesis: (id: string) => void;
  addExperiment: (experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editExperiment: (id: string, experiment: Partial<Experiment>) => void;
  deleteExperiment: (id: string) => void;
  updatePectiWeights: (weights: Partial<PECTIWeights>) => void;
  getIdeaById: (id: string) => GrowthIdea | undefined;
  getHypothesisByIdeaId: (ideaId: string) => Hypothesis | undefined;
  getHypothesisById: (id: string) => Hypothesis | undefined;
  getExperimentByHypothesisId: (hypothesisId: string) => Experiment | undefined;
  getDepartmentById: (id: string) => Department | undefined;
  getAllTags: () => Tag[];
  getAllUserNames: () => {id: string; name: string}[];
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const getInitialData = <T extends unknown>(key: string, defaultValue: T): T => {
  const storedValue = localStorage.getItem(key);
  return storedValue ? JSON.parse(storedValue) : defaultValue;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
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
  
  const [pectiWeights, setPectiWeights] = useState<PECTIWeights>(() =>
    DEFAULT_PECTI_WEIGHTS
  );
  
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
    localStorage.setItem('pectiWeights', JSON.stringify(pectiWeights));
  }, [pectiWeights]);
  
  const filteredIdeas = ideas.filter(idea => 
    !currentCompany || idea.companyId === currentCompany.id || !idea.companyId
  );
  
  const filteredHypotheses = hypotheses.filter(hypothesis => 
    !currentCompany || hypothesis.companyId === currentCompany.id || !hypothesis.companyId
  );
  
  const filteredExperiments = experiments.filter(experiment => 
    !currentCompany || experiment.companyId === currentCompany.id || !experiment.companyId
  );
  
  const getAllTags = (): Tag[] => {
    const tagsSet = new Set<Tag>();
    
    filteredIdeas.forEach(idea => {
      if (idea.tags) {
        idea.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    
    return Array.from(tagsSet);
  };
  
  const getAllUserNames = () => {
    const usersMap = new Map<string, string>();
    
    [...filteredIdeas, ...filteredHypotheses, ...filteredExperiments].forEach(item => {
      if (item.userId && item.userName) {
        usersMap.set(item.userId, item.userName);
      }
    });
    
    return Array.from(usersMap.entries()).map(([id, name]) => ({ id, name }));
  };
  
  const updatePectiWeights = (weights: Partial<PECTIWeights>) => {
    setPectiWeights(prev => ({
      ...prev,
      ...weights
    }));
  };
  
  const addDepartment = (name: string) => {
    setDepartments([...departments, { id: generateId(), name }]);
  };
  
  const editDepartment = (id: string, name: string) => {
    setDepartments(departments.map(dept => 
      dept.id === id ? { ...dept, name } : dept
    ));
  };
  
  const deleteDepartment = (id: string) => {
    const ideasUsingDepartment = ideas.some(idea => idea.departmentId === id);
    
    if (ideasUsingDepartment) {
      alert('Cannot delete department that has ideas associated with it.');
      return;
    }
    
    setDepartments(departments.filter(dept => dept.id !== id));
  };
  
  const addIdea = (idea: Omit<GrowthIdea, 'id' | 'createdAt'>) => {
    setIdeas([
      ...ideas,
      {
        ...idea,
        id: generateId(),
        createdAt: new Date(),
        userId: user?.id || undefined,
        userName: user?.user_metadata?.full_name || user?.email || undefined,
        companyId: currentCompany?.id
      }
    ]);
  };
  
  const editIdea = (id: string, ideaUpdates: Partial<GrowthIdea>) => {
    setIdeas(ideas.map(idea => 
      idea.id === id ? { ...idea, ...ideaUpdates } : idea
    ));
  };
  
  const deleteIdea = (id: string) => {
    const hypothesisWithIdea = hypotheses.find(h => h.ideaId === id);
    
    if (hypothesisWithIdea) {
      alert('Cannot delete idea that has a hypothesis associated with it.');
      return;
    }
    
    setIdeas(ideas.filter(idea => idea.id !== id));
  };
  
  const addHypothesis = (hypothesis: Omit<Hypothesis, 'id' | 'createdAt'>) => {
    setHypotheses([
      ...hypotheses,
      {
        ...hypothesis,
        id: generateId(),
        createdAt: new Date(),
        status: hypothesis.status || 'Backlog',
        userId: hypothesis.userId || user?.id,
        userName: hypothesis.userName || user?.user_metadata?.full_name || user?.email,
        companyId: currentCompany?.id
      }
    ]);
  };
  
  const editHypothesis = (id: string, hypothesisUpdates: Partial<Hypothesis>) => {
    setHypotheses(hypotheses.map(hypothesis => 
      hypothesis.id === id ? { ...hypothesis, ...hypothesisUpdates } : hypothesis
    ));
  };
  
  const deleteHypothesis = (id: string) => {
    const experimentWithHypothesis = experiments.find(e => e.hypothesisId === id);
    
    if (experimentWithHypothesis) {
      alert('Cannot delete hypothesis that has an experiment associated with it.');
      return;
    }
    
    setHypotheses(hypotheses.filter(hypothesis => hypothesis.id !== id));
  };
  
  const addExperiment = (experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    setExperiments([
      ...experiments,
      {
        ...experiment,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        userId: experiment.userId || user?.id,
        userName: experiment.userName || user?.user_metadata?.full_name || user?.email,
        companyId: currentCompany?.id
      }
    ]);
  };
  
  const editExperiment = (id: string, experimentUpdates: Partial<Experiment>) => {
    setExperiments(experiments.map(experiment => 
      experiment.id === id ? { ...experiment, ...experimentUpdates, updatedAt: new Date() } : experiment
    ));
  };
  
  const deleteExperiment = (id: string) => {
    setExperiments(experiments.filter(experiment => experiment.id !== id));
  };
  
  const getIdeaById = (id: string) => filteredIdeas.find(idea => idea.id === id);
  const getHypothesisByIdeaId = (ideaId: string) => filteredHypotheses.find(h => h.ideaId === ideaId);
  const getHypothesisById = (id: string) => filteredHypotheses.find(h => h.id === id);
  const getExperimentByHypothesisId = (hypothesisId: string) => filteredExperiments.find(e => e.hypothesisId === hypothesisId);
  const getDepartmentById = (id: string) => departments.find(d => d.id === id);
  
  return (
    <AppContext.Provider value={{
      departments,
      ideas: filteredIdeas,
      hypotheses: filteredHypotheses,
      experiments: filteredExperiments,
      pectiWeights,
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
      updatePectiWeights,
      getIdeaById,
      getHypothesisByIdeaId,
      getHypothesisById,
      getExperimentByHypothesisId,
      getDepartmentById,
      getAllTags,
      getAllUserNames
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
