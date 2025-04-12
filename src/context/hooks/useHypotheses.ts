
import { useState, useEffect } from 'react';
import { Hypothesis, HypothesisStatus, PECTIWeights, PECTI, ObservationContent } from '@/types';
import { generateId } from '../utils/dataUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export const useHypotheses = (
  user: any,
  currentCompany: any,
  experiments: any[]
) => {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Helper functions to convert data types
  const parseHypothesisStatus = (status: string | null): HypothesisStatus => {
    if (!status) return "Backlog";
    
    if (status === "Backlog" || status === "Selected For Testing" || 
        status === "Testing" || status === "Completed" || status === "Archived") {
      return status as HypothesisStatus;
    }
    return "Backlog";
  };

  const parsePectiScore = (score: Json | null): PECTI => {
    if (!score || typeof score !== 'object') {
      return {
        potential: 1,
        ease: 1,
        cost: 1,
        time: 1,
        impact: 1
      };
    }
    
    const scoreObject = score as Record<string, any>;
    
    return {
      potential: scoreObject.potential || 1,
      ease: scoreObject.ease || 1,
      cost: scoreObject.cost || 1,
      time: scoreObject.time || 1,
      impact: scoreObject.impact || 1
    };
  };

  const parseObservationContent = (content: Json | null): ObservationContent | undefined => {
    if (!content) return undefined;
    
    if (typeof content === 'object') {
      return content as ObservationContent;
    }
    
    return { text: String(content) };
  };
  
  useEffect(() => {
    const fetchHypotheses = async () => {
      if (!user?.id) {
        setHypotheses([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        let query = supabase.from('hypotheses')
          .select('*')
          .eq('userid', user.id);
          
        if (currentCompany?.id) {
          query = query.eq('company_id', currentCompany.id);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        if (data) {
          const formattedHypotheses: Hypothesis[] = data.map(h => ({
            id: h.id,
            ideaId: h.ideaid || '',
            initiative: h.initiative || '',
            observation: h.observation || '',
            metric: h.metric || '',
            status: parseHypothesisStatus(h.status),
            pectiScore: parsePectiScore(h.pectiscore),
            createdAt: new Date(h.createdat),
            userId: h.userid,
            userName: h.username,
            companyId: h.company_id,
            observationContent: parseObservationContent(h.observationcontent)
          }));
          
          setHypotheses(formattedHypotheses);
          console.log('Hypotheses fetched from Supabase:', formattedHypotheses);
        }
      } catch (error: any) {
        console.error('Error fetching hypotheses:', error.message);
        toast.error('Failed to load hypotheses');
        
        const userKey = `hypotheses_${user.id}`;
        const savedHypotheses = localStorage.getItem(userKey);
        if (savedHypotheses) {
          setHypotheses(JSON.parse(savedHypotheses));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHypotheses();
  }, [user?.id, currentCompany?.id]);
  
  const filteredHypotheses = hypotheses.filter(hypothesis => 
    !currentCompany || hypothesis.companyId === currentCompany.id || !hypothesis.companyId
  );
  
  const addHypothesis = async (hypothesis: Omit<Hypothesis, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase.from('hypotheses').insert({
        ideaid: hypothesis.ideaId,
        initiative: hypothesis.initiative,
        observation: hypothesis.observation,
        metric: hypothesis.metric,
        status: hypothesis.status || 'Backlog',
        pectiscore: hypothesis.pectiScore,
        userid: user?.id,
        username: user?.user_metadata?.full_name || user?.email,
        company_id: currentCompany?.id,
        observationcontent: hypothesis.observationContent
      }).select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const newHypothesis: Hypothesis = {
          id: data[0].id,
          ideaId: data[0].ideaid || '',
          initiative: data[0].initiative || '',
          observation: data[0].observation || '',
          metric: data[0].metric || '',
          status: parseHypothesisStatus(data[0].status),
          pectiScore: parsePectiScore(data[0].pectiscore),
          createdAt: new Date(data[0].createdat),
          userId: data[0].userid,
          userName: data[0].username,
          companyId: data[0].company_id,
          observationContent: parseObservationContent(data[0].observationcontent)
        };
        
        setHypotheses(prevHypotheses => [...prevHypotheses, newHypothesis]);
        toast.success('Hypothesis added successfully');
      }
    } catch (error: any) {
      console.error('Error adding hypothesis:', error.message);
      toast.error('Failed to add hypothesis');
      
      const newHypothesis = {
        ...hypothesis,
        id: generateId(),
        createdAt: new Date(),
        userId: hypothesis.userId || user?.id,
        userName: user?.user_metadata?.full_name || user?.email,
        companyId: currentCompany?.id,
        status: hypothesis.status || 'Backlog'
      };
      
      setHypotheses(prevHypotheses => [...prevHypotheses, newHypothesis]);
      
      const userKey = `hypotheses_${user.id}`;
      localStorage.setItem(userKey, JSON.stringify([...hypotheses, newHypothesis]));
    }
  };
  
  const editHypothesis = async (id: string, hypothesisUpdates: Partial<Hypothesis>) => {
    try {
      const updates: Record<string, any> = {};
      
      if (hypothesisUpdates.initiative !== undefined) {
        updates.initiative = hypothesisUpdates.initiative;
      }
      
      if (hypothesisUpdates.observation !== undefined) {
        updates.observation = hypothesisUpdates.observation;
      }
      
      if (hypothesisUpdates.metric !== undefined) {
        updates.metric = hypothesisUpdates.metric;
      }
      
      if (hypothesisUpdates.status !== undefined) {
        updates.status = hypothesisUpdates.status;
      }
      
      if (hypothesisUpdates.pectiScore !== undefined) {
        updates.pectiscore = hypothesisUpdates.pectiScore;
      }
      
      if (hypothesisUpdates.observationContent !== undefined) {
        updates.observationcontent = hypothesisUpdates.observationContent;
      }
      
      const { error } = await supabase
        .from('hypotheses')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      setHypotheses(prevHypotheses => 
        prevHypotheses.map(hypothesis => hypothesis.id === id ? { ...hypothesis, ...hypothesisUpdates } : hypothesis)
      );
      
      toast.success('Hypothesis updated successfully');
    } catch (error: any) {
      console.error('Error updating hypothesis:', error.message);
      toast.error('Failed to update hypothesis');
      
      setHypotheses(hypotheses.map(hypothesis => 
        hypothesis.id === id ? { ...hypothesis, ...hypothesisUpdates } : hypothesis
      ));
    }
  };
  
  const deleteHypothesis = async (id: string) => {
    const experimentWithHypothesis = experiments.find(e => e.hypothesisId === id);
    
    if (experimentWithHypothesis) {
      toast.error('Cannot delete hypothesis that has an experiment associated with it.');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('hypotheses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setHypotheses(prevHypotheses => prevHypotheses.filter(hypothesis => hypothesis.id !== id));
      toast.success('Hypothesis deleted successfully');
    } catch (error: any) {
      console.error('Error deleting hypothesis:', error.message);
      toast.error('Failed to delete hypothesis');
      
      setHypotheses(hypotheses.filter(hypothesis => hypothesis.id !== id));
    }
  };

  const updateAllHypothesesWeights = (pectiWeights: PECTIWeights) => {
    setHypotheses(prevHypotheses => 
      prevHypotheses.map(hypothesis => ({
        ...hypothesis,
        // We keep the original PECTI scores but apply the new weights when calculating percentages
      }))
    );
  };

  const getHypothesisByIdeaId = (ideaId: string) => filteredHypotheses.find(h => h.ideaId === ideaId);
  const getHypothesisById = (id: string) => filteredHypotheses.find(h => h.id === id);
  
  return {
    hypotheses: filteredHypotheses,
    isLoading,
    addHypothesis,
    editHypothesis,
    deleteHypothesis,
    updateAllHypothesesWeights,
    getHypothesisByIdeaId,
    getHypothesisById
  };
};
