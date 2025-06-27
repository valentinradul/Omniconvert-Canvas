
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Company, CompanyRole } from '@/types';

export function useInvitations() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Accept invitation function
  const acceptInvitation = async (invitationId: string, userId: string | undefined, invitations: any[]) => {
    if (!userId) return null;
    
    setIsProcessing(true);
    
    try {
      // Get invitation data
      const invitation = invitations.find(inv => inv.id === invitationId);
      
      if (!invitation) {
        throw new Error("Invitation not found");
      }
      
      console.log('Accepting invitation:', invitation);
      
      // Ensure user has a profile first
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (profileCheckError && profileCheckError.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const { error: profileCreateError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: 'User' // Default name, user can update later
          });
          
        if (profileCreateError) {
          console.error('Error creating profile:', profileCreateError);
          // Continue anyway, profile creation is not critical
        }
      }
      
      // Accept invitation
      const { error: updateError } = await supabase
        .from('company_invitations')
        .update({ accepted: true })
        .eq('id', invitationId);
        
      if (updateError) throw updateError;
      
      // Add user as company member
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: invitation.companyId,
          user_id: userId,
          role: invitation.role
        });
        
      if (memberError) throw memberError;
      
      // Get company details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', invitation.companyId)
        .single();
        
      if (companyError) throw companyError;
      
      const company: Company = {
        id: companyData.id,
        name: companyData.name,
        createdAt: new Date(companyData.created_at),
        createdBy: companyData.created_by
      };
      
      // Set the company as current company in localStorage
      localStorage.setItem('currentCompanyId', company.id);
      
      toast({
        title: "Welcome to the team!",
        description: `You are now a member of ${company.name}. Redirecting to dashboard...`,
      });
      
      // Redirect to dashboard after successful acceptance
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
      
      return { company, invitationId, role: invitation.role };
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      
      toast({
        variant: "destructive",
        title: "Failed to accept invitation",
        description: error.message || "There was an error accepting the invitation",
      });
      
      return null;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Decline invitation function
  const declineInvitation = async (invitationId: string) => {
    setIsProcessing(true);
    
    try {
      // Delete invitation
      const { error } = await supabase
        .from('company_invitations')
        .delete()
        .eq('id', invitationId);
        
      if (error) throw error;
      
      toast({
        title: "Invitation declined",
        description: "The invitation has been declined",
      });
      
      return invitationId;
    } catch (error: any) {
      console.error('Error declining invitation:', error);
      
      toast({
        variant: "destructive",
        title: "Failed to decline invitation",
        description: error.message || "There was an error declining the invitation",
      });
      
      return null;
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    acceptInvitation,
    declineInvitation,
    isProcessing
  };
}
