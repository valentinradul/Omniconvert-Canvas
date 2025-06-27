
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Company, CompanyRole } from '@/types';

export function useInvitations() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Accept invitation function
  const acceptInvitation = async (invitationId: string, userId: string | undefined, invitations: any[]) => {
    console.log('Starting invitation acceptance process:', { invitationId, userId, invitationsCount: invitations.length });
    
    if (!userId) {
      console.error('No user ID provided for invitation acceptance');
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to accept the invitation",
      });
      return null;
    }
    
    setIsProcessing(true);
    
    try {
      // Get invitation data
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (!invitation) {
        console.error('Invitation not found:', invitationId);
        throw new Error("Invitation not found");
      }
      
      console.log('Found invitation:', invitation);
      
      // Use correct property name - check both variations to be safe
      const companyId = invitation.company_id || invitation.companyId;
      if (!companyId) {
        console.error('No company ID found in invitation:', invitation);
        throw new Error("Invalid invitation - missing company information");
      }
      
      console.log('Adding user to company members:', { userId, companyId, role: invitation.role });
      
      // Add user to company members
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: companyId,
          user_id: userId,
          role: invitation.role
        });
        
      if (memberError) {
        console.error('Error adding company member:', memberError);
        throw memberError;
      }
      
      console.log('Successfully added user to company members');
      
      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('company_invitations')
        .update({ accepted: true })
        .eq('id', invitationId);
        
      if (updateError) {
        console.error('Error updating invitation status:', updateError);
        throw updateError;
      }
      
      console.log('Successfully marked invitation as accepted');
      
      // Get company details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
        
      if (companyError) {
        console.error('Error fetching company data:', companyError);
        throw companyError;
      }
      
      console.log('Retrieved company data:', companyData);
      
      const company: Company = {
        id: companyData.id,
        name: companyData.name,
        createdAt: new Date(companyData.created_at),
        createdBy: companyData.created_by
      };
      
      // Set the company as current company in localStorage
      localStorage.setItem('currentCompanyId', company.id);
      localStorage.removeItem('userCompanies');
      
      console.log('Set current company ID in localStorage:', company.id);
      
      toast({
        title: "Welcome to the team!",
        description: `You are now a member of ${company.name}. Redirecting to dashboard...`,
      });
      
      // Redirect to dashboard
      setTimeout(() => {
        console.log('Redirecting to dashboard after successful invitation acceptance');
        window.location.href = '/dashboard';
      }, 1500);
      
      return { company, invitationId, role: invitation.role };
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      
      // Provide more specific error messages
      let errorMessage = "There was an error accepting the invitation";
      
      if (error.message?.includes('permission denied')) {
        errorMessage = "You don't have permission to join this company";
      } else if (error.message?.includes('violates row-level security')) {
        errorMessage = "Access denied - please contact the company administrator";
      } else if (error.message?.includes('duplicate key')) {
        errorMessage = "You are already a member of this company";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Failed to accept invitation",
        description: errorMessage,
      });
      
      return null;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Decline invitation function
  const declineInvitation = async (invitationId: string) => {
    console.log('Declining invitation:', invitationId);
    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('company_invitations')
        .delete()
        .eq('id', invitationId);
        
      if (error) {
        console.error('Error declining invitation:', error);
        throw error;
      }
      
      console.log('Successfully declined invitation');
      
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
