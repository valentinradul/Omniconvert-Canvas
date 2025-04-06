import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { TeamMemberFormData } from '@/types';
import { fetchUserTeam } from '@/services/teamService';
import { addTeamMemberToTeam } from '@/services/teamMemberService';
import { supabase } from '@/integrations/supabase/client';

export const useTeamInvitations = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentEmails, setSentEmails] = useState<string[]>([]);

  const handleInvitations = async (emails: string[], message: string) => {
    setIsSubmitting(true);
    
    try {
      if (!user) {
        console.error('User not authenticated');
        toast.error('You must be logged in to invite team members');
        return { success: false, sentEmails: [] };
      }
      
      console.log("Fetching team for user:", user.id);
      let currentTeam = await fetchUserTeam(user.id);
      
      if (!currentTeam || !currentTeam.id) {
        console.error('No team found for user');
        
        // Attempt to create a team for the user if one doesn't exist
        console.log("Attempting to create a team for user");
        try {
          const { data: newTeam, error } = await supabase
            .from('teams')
            .insert({
              name: 'My Experiment Team',
              created_by: user.id
            })
            .select()
            .single();
            
          if (error) {
            throw new Error(`Failed to create team: ${error.message}`);
          }
          
          console.log("Created new team:", newTeam);
          currentTeam = newTeam;
        } catch (teamCreateError) {
          console.error('Failed to create team:', teamCreateError);
          toast.error('Failed to create team');
          return { success: false, sentEmails: [] };
        }
      }
      
      const teamId = currentTeam.id;
      console.log("Using team ID:", teamId);
      
      const successfulInvites: string[] = [];
      
      // Process invites one by one
      for (const email of emails) {
        if (!email.trim()) continue; // Skip empty emails
        
        try {
          console.log(`Processing invitation for email: ${email}`);
          const memberData: TeamMemberFormData = {
            email,
            name: email.split('@')[0],
            role: 'Team Member',
            department: '',
            customMessage: message
          };
          
          const result = await addTeamMemberToTeam(teamId, memberData);
          
          // Check if the result is an error object
          if (result && !('error' in result)) {
            console.log(`Successfully invited: ${email}`);
            successfulInvites.push(email);
          } else {
            console.error(`Failed to invite ${email}: ${result && 'error' in result ? result.error : 'Unknown error'}`);
          }
        } catch (err) {
          console.error(`Failed to invite ${email}:`, err);
        }
      }
      
      setSentEmails(successfulInvites);
      
      return { 
        success: successfulInvites.length > 0, 
        sentEmails: successfulInvites 
      };
    } catch (error) {
      console.error('Error inviting team members:', error);
      toast.error('Failed to invite team members');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleInvitations,
    isSubmitting,
    sentEmails
  };
};
