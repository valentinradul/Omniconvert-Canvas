
import { supabase } from '@/integrations/supabase/client';
import { GrowthIdea, Hypothesis, Experiment } from '@/types';
import { toast } from 'sonner';

export const recoverOrphanedData = async (targetEmail: string) => {
  try {
    console.log(`Attempting to recover data for: ${targetEmail}`);
    // Step 1: Get the user ID for the target email
    const { data: userData, error: userError } = await supabase.auth.getUser();
      
    if (userError || !userData?.user) {
      // Try to find user directly
      toast.error('You must be logged in to recover data');
      console.error('Error getting user:', userError);
      return false;
    }
    
    const userId = userData.user.id;
    console.log(`Found user ID: ${userId} for recovery`);
    return recoverLocalStorageData(userId);
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
        console.log(`Found ${oldIdeas.length} orphaned ideas`);
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
        console.log(`Found ${oldHypotheses.length} orphaned hypotheses`);
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
        console.log(`Found ${oldExperiments.length} orphaned experiments`);
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

// Export function to manually check/recover old-format data
export const checkAndMigrateLocalData = (userId: string) => {
  if (!userId) return false;
  
  let migratedCount = 0;
  
  ['ideas', 'hypotheses', 'experiments'].forEach(dataType => {
    const oldData = localStorage.getItem(dataType);
    if (oldData) {
      // Check if user-specific data already exists
      const userSpecificKey = `${dataType}_${userId}`;
      const existingUserData = localStorage.getItem(userSpecificKey);
      
      if (!existingUserData) {
        // Only migrate if no user-specific data exists
        localStorage.setItem(userSpecificKey, oldData);
        migratedCount++;
      }
    }
  });
  
  return migratedCount > 0;
};
