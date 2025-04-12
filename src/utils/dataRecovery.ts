
import { supabase } from '@/integrations/supabase/client';
import { GrowthIdea, Hypothesis, Experiment } from '@/types';
import { toast } from 'sonner';

export const recoverOrphanedData = async (targetEmail: string) => {
  try {
    // Step 1: Get the user ID for the target email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', targetEmail)
      .single();
      
    if (userError) {
      // Try to get user directly from auth
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(targetEmail);
      
      if (authError || !authUser) {
        throw new Error(`Could not find user with email ${targetEmail}`);
      }
      
      console.log('Found user from auth:', authUser);
      return recoverLocalStorageData(authUser.id);
    }
    
    return recoverLocalStorageData(userData.id);
  } catch (error) {
    console.error('Error recovering data:', error);
    toast.error('Failed to recover data. See console for details.');
    return false;
  }
};

const recoverLocalStorageData = (userId: string) => {
  let recoveredCount = 0;
  
  // Step 2: Look for orphaned data in localStorage with old keys
  try {
    // Recover ideas
    const oldIdeasStr = localStorage.getItem('ideas');
    if (oldIdeasStr) {
      const oldIdeas: GrowthIdea[] = JSON.parse(oldIdeasStr);
      if (oldIdeas.length > 0) {
        // Associate ideas with the user
        const updatedIdeas = oldIdeas.map(idea => ({
          ...idea,
          userId: userId,
          userName: idea.userName || 'Recovered User'
        }));
        
        // Save to new user-specific key
        localStorage.setItem(`ideas_${userId}`, JSON.stringify(updatedIdeas));
        recoveredCount += updatedIdeas.length;
      }
    }
    
    // Recover hypotheses
    const oldHypothesesStr = localStorage.getItem('hypotheses');
    if (oldHypothesesStr) {
      const oldHypotheses: Hypothesis[] = JSON.parse(oldHypothesesStr);
      if (oldHypotheses.length > 0) {
        // Associate hypotheses with the user
        const updatedHypotheses = oldHypotheses.map(hypothesis => ({
          ...hypothesis,
          userId: userId,
          userName: hypothesis.userName || 'Recovered User'
        }));
        
        // Save to new user-specific key
        localStorage.setItem(`hypotheses_${userId}`, JSON.stringify(updatedHypotheses));
        recoveredCount += updatedHypotheses.length;
      }
    }
    
    // Recover experiments
    const oldExperimentsStr = localStorage.getItem('experiments');
    if (oldExperimentsStr) {
      const oldExperiments: Experiment[] = JSON.parse(oldExperimentsStr);
      if (oldExperiments.length > 0) {
        // Associate experiments with the user
        const updatedExperiments = oldExperiments.map(experiment => ({
          ...experiment,
          userId: userId,
          userName: experiment.userName || 'Recovered User'
        }));
        
        // Save to new user-specific key
        localStorage.setItem(`experiments_${userId}`, JSON.stringify(updatedExperiments));
        recoveredCount += updatedExperiments.length;
      }
    }
    
    if (recoveredCount > 0) {
      toast.success(`Recovered ${recoveredCount} items and associated them with your account.`);
      return true;
    } else {
      toast.warning('No data found to recover.');
      return false;
    }
  } catch (error) {
    console.error('Error recovering localStorage data:', error);
    toast.error('Failed to recover data from localStorage.');
    return false;
  }
};
