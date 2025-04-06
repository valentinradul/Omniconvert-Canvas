
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapToTeamMembers } from './teamMemberService';
export type { TeamMemberData, TeamMemberError } from './types/teamTypes';

/**
 * Fetches the team ID for the current user
 */
export const fetchUserTeam = async (userId: string) => {
  console.log("Fetching team for user ID:", userId);
  
  try {
    // First try to get a team where the user is the creator
    let { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('created_by', userId)
      .maybeSingle();
      
    if (teamError) {
      console.error('Error fetching team:', teamError);
      return null;
    }
    
    // If no team is found where the user is the creator, try to find a team where the user is a member
    if (!teamData) {
      const { data: memberTeamData, error: memberTeamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (memberTeamError) {
        console.error('Error fetching team membership:', memberTeamError);
        return null;
      }
      
      if (memberTeamData && memberTeamData.team_id) {
        // Get the team details
        const { data: foundTeam, error: foundTeamError } = await supabase
          .from('teams')
          .select('id, name')
          .eq('id', memberTeamData.team_id)
          .single();
          
        if (foundTeamError) {
          console.error('Error fetching team details:', foundTeamError);
          return null;
        }
        
        teamData = foundTeam;
      }
    }
    
    console.log("Team data found:", teamData);
    return teamData;
  } catch (error) {
    console.error('Error in fetchUserTeam:', error);
    return null;
  }
};
