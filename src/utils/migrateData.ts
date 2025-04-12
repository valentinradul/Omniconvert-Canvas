
import { supabase } from '@/integrations/supabase/client';

export const migrateDataToUser = async (targetEmail: string) => {
  try {
    // Get all existing data from localStorage
    const oldIdeas = localStorage.getItem('ideas') ? JSON.parse(localStorage.getItem('ideas')!) : [];
    const oldHypotheses = localStorage.getItem('hypotheses') ? JSON.parse(localStorage.getItem('hypotheses')!) : [];
    const oldExperiments = localStorage.getItem('experiments') ? JSON.parse(localStorage.getItem('experiments')!) : [];

    // Get the user ID for the target email directly from auth
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    
    if (!userData || !userData.user || userData.user.email !== targetEmail) {
      throw new Error(`User ${targetEmail} is not currently logged in. Only the logged-in user's data can be migrated.`);
    }
    
    const userId = userData.user.id;

    // Create the keys for this user
    const userIdeasKey = `user_${userId}_ideas`;
    const userHypothesesKey = `user_${userId}_hypotheses`;
    const userExperimentsKey = `user_${userId}_experiments`;

    // Check if OmniConvert company already exists for this user
    let companyId = null;
    
    const { data: existingCompanies, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('name', 'OmniConvert');
      
    if (companyError) throw companyError;

    if (existingCompanies && existingCompanies.length > 0) {
      companyId = existingCompanies[0].id;
    } else {
      // Create OmniConvert company
      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({ 
          name: 'OmniConvert', 
          created_by: userId 
        })
        .select()
        .single();
        
      if (createError) throw createError;
      
      companyId = newCompany.id;
      
      // Add user as company owner
      await supabase
        .from('company_members')
        .insert({
          company_id: companyId,
          user_id: userId,
          role: 'owner'
        });
    }

    // Update data with user ID and company ID
    const updatedIdeas = oldIdeas.map((idea: any) => ({
      ...idea,
      userId: userId,
      userName: targetEmail.split('@')[0],
      companyId: companyId
    }));

    const updatedHypotheses = oldHypotheses.map((hypo: any) => ({
      ...hypo,
      userId: userId,
      userName: targetEmail.split('@')[0],
      companyId: companyId
    }));

    const updatedExperiments = oldExperiments.map((exp: any) => ({
      ...exp,
      userId: userId,
      userName: targetEmail.split('@')[0],
      companyId: companyId
    }));

    // Store the updated data in user-specific localStorage keys
    localStorage.setItem(userIdeasKey, JSON.stringify(updatedIdeas));
    localStorage.setItem(userHypothesesKey, JSON.stringify(updatedHypotheses));
    localStorage.setItem(userExperimentsKey, JSON.stringify(updatedExperiments));

    // Set the OmniConvert company as the current company for this user
    localStorage.setItem(`user_${userId}_currentCompanyId`, companyId);

    console.log("Successfully migrated data for:", targetEmail);
    console.log("User ID:", userId);
    console.log("Company ID:", companyId);
    console.log("Ideas count:", updatedIdeas.length);
    console.log("Hypotheses count:", updatedHypotheses.length);
    console.log("Experiments count:", updatedExperiments.length);

    return {
      success: true,
      message: `Data successfully migrated to user ${targetEmail} under OmniConvert company`,
      ideasCount: updatedIdeas.length,
      hypothesesCount: updatedHypotheses.length,
      experimentsCount: updatedExperiments.length
    };
  } catch (error: any) {
    console.error("Error migrating data:", error);
    return {
      success: false,
      message: `Failed to migrate data: ${error.message}`
    };
  }
};

export const runDataMigration = async () => {
  return migrateDataToUser('valentin.radu@omniconvert.com');
};
