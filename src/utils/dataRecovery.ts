
import { supabase } from '@/integrations/supabase/client';
import { GrowthIdea, Hypothesis, Experiment } from '@/types';

// This function will attempt to recover data from localStorage and associate it with a user
export const recoverUserData = async (userId: string) => {
  try {
    // Get all existing data from localStorage
    const oldIdeas = localStorage.getItem('ideas') ? JSON.parse(localStorage.getItem('ideas')!) : [];
    const oldHypotheses = localStorage.getItem('hypotheses') ? JSON.parse(localStorage.getItem('hypotheses')!) : [];
    const oldExperiments = localStorage.getItem('experiments') ? JSON.parse(localStorage.getItem('experiments')!) : [];

    // Check if we have any data to recover
    if (oldIdeas.length === 0 && oldHypotheses.length === 0 && oldExperiments.length === 0) {
      return {
        success: false,
        message: 'No data found in localStorage to recover',
        ideasCount: 0,
        hypothesesCount: 0,
        experimentsCount: 0
      };
    }

    // Get or create a company for this user
    let companyId = null;
    
    // Check if the user already has a company
    const { data: companyMembersData, error: membershipError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId);
      
    if (membershipError) throw membershipError;
    
    if (companyMembersData && companyMembersData.length > 0) {
      companyId = companyMembersData[0].company_id;
    } else {
      // Create default company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({ 
          name: 'My Company', 
          created_by: userId 
        })
        .select()
        .single();
        
      if (companyError) throw companyError;
      
      companyId = companyData.id;
      
      // Add user as company owner
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: companyId,
          user_id: userId,
          role: 'owner'
        });
        
      if (memberError) throw memberError;
    }
    
    // Get user's profile info to add username
    const { data: userProfile } = await supabase.auth.getUser();
    const userName = userProfile?.user?.user_metadata?.full_name || userProfile?.user?.email?.split('@')[0];

    // Update data with user ID and company ID
    const updatedIdeas = oldIdeas.map((idea: GrowthIdea) => ({
      ...idea,
      userid: userId,
      username: userName,
      company_id: companyId
    }));

    const updatedHypotheses = oldHypotheses.map((hypo: Hypothesis) => ({
      ...hypo,
      userid: userId,
      username: userName,
      company_id: companyId
    }));

    const updatedExperiments = oldExperiments.map((exp: Experiment) => ({
      ...exp,
      userid: userId,
      username: userName,
      company_id: companyId
    }));

    // Store the updated data in user-specific localStorage keys
    const userIdeasKey = `user_${userId}_ideas`;
    const userHypothesesKey = `user_${userId}_hypotheses`;
    const userExperimentsKey = `user_${userId}_experiments`;
    
    localStorage.setItem(userIdeasKey, JSON.stringify(updatedIdeas));
    localStorage.setItem(userHypothesesKey, JSON.stringify(updatedHypotheses));
    localStorage.setItem(userExperimentsKey, JSON.stringify(updatedExperiments));

    // Set the company as the current company for this user
    localStorage.setItem(`user_${userId}_currentCompanyId`, companyId);

    // Clean up the global storage to prevent data leakage
    localStorage.removeItem('ideas');
    localStorage.removeItem('hypotheses');
    localStorage.removeItem('experiments');

    return {
      success: true,
      message: `Data successfully recovered and associated with your account`,
      ideasCount: updatedIdeas.length,
      hypothesesCount: updatedHypotheses.length,
      experimentsCount: updatedExperiments.length
    };
  } catch (error: any) {
    console.error("Error recovering data:", error);
    return {
      success: false,
      message: `Failed to recover data: ${error.message}`
    };
  }
};
