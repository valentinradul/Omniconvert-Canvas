
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { TeamMemberFormData } from '@/types';
import { fetchUserTeam, addTeamMemberToTeam } from '@/services/teamService';

export const useTeamInvitations = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentEmails, setSentEmails] = useState<string[]>([]);

  const handleInvitations = async (emails: string[], message: string) => {
    setIsSubmitting(true);
    
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const teamData = await fetchUserTeam(user.id);
      
      if (!teamData || !teamData.id) {
        throw new Error('Team not found');
      }
      
      const teamId = teamData.id;
      const successfulInvites: string[] = [];
      
      // Process invites one by one
      for (const email of emails) {
        try {
          const memberData: TeamMemberFormData = {
            email,
            name: email.split('@')[0],
            role: 'Team Member',
            department: '',
            customMessage: message
          };
          
          await addTeamMemberToTeam(teamId, memberData);
          successfulInvites.push(email);
        } catch (err) {
          console.error(`Failed to invite ${email}:`, err);
          toast.error(`Failed to invite ${email}`);
        }
      }
      
      setSentEmails(successfulInvites);
      
      if (successfulInvites.length > 0) {
        toast.success(`Successfully invited ${successfulInvites.length} team members`);
      }
      
      return { success: successfulInvites.length > 0, sentEmails: successfulInvites };
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
