
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Company, CompanyRole } from '@/types';

export function useInvitations() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Accept invitation function with enhanced company ID matching
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
      // Get invitation data from database with exact company ID
      const { data: invitation, error: invitationError } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('accepted', false)
        .single();
        
      if (invitationError || !invitation) {
        console.error('Invitation not found or invalid:', invitationError);
        throw new Error("Invitation not found or already used");
      }
      
      console.log('Found valid invitation with company ID:', invitation.company_id);
      
      // Check if user is already a member of this EXACT company
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('company_members')
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', invitation.company_id) // Use exact company ID from invitation
        .maybeSingle();
        
      if (memberCheckError) {
        console.error('Error checking existing membership:', memberCheckError);
        throw new Error("Unable to verify membership status");
      }
      
      if (existingMember) {
        console.log('User is already a member of company ID:', existingMember.company_id);
        console.log('Expected company ID from invitation:', invitation.company_id);
        
        // Verify company IDs match exactly
        if (existingMember.company_id !== invitation.company_id) {
          console.error('Company ID mismatch:', {
            existingCompanyId: existingMember.company_id,
            invitationCompanyId: invitation.company_id
          });
          throw new Error("Company ID mismatch detected");
        }
        
        // Update existing membership role if different
        if (existingMember.role !== invitation.role) {
          console.log('Updating member role from', existingMember.role, 'to', invitation.role);
          
          const { error: updateError } = await supabase
            .from('company_members')
            .update({ role: invitation.role })
            .eq('id', existingMember.id);
            
          if (updateError) {
            console.error('Error updating member role:', updateError);
            throw updateError;
          }
          
          console.log('Successfully updated member role');
        }
      } else {
        console.log('Adding user to company members with exact company ID:', { 
          userId, 
          companyId: invitation.company_id, 
          role: invitation.role 
        });
        
        // Add user to company members with EXACT company ID from invitation
        const { error: memberError } = await supabase
          .from('company_members')
          .insert({
            company_id: invitation.company_id, // Use exact company ID from invitation
            user_id: userId,
            role: invitation.role
          });
          
        if (memberError) {
          console.error('Error adding company member:', memberError);
          throw memberError;
        }
        
        console.log('Successfully added user to company with ID:', invitation.company_id);
      }
      
      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('company_invitations')
        .update({ accepted: true })
        .eq('id', invitationId);
        
      if (updateError) {
        console.error('Error updating invitation status:', updateError);
        console.warn('Failed to mark invitation as accepted, but user was added to company');
      } else {
        console.log('Successfully marked invitation as accepted');
      }
      
      // Get company details using exact company ID from invitation
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', invitation.company_id) // Use exact company ID from invitation
        .single();
        
      if (companyError) {
        console.error('Error fetching company data:', companyError);
        throw companyError;
      }
      
      console.log('Retrieved company data with matching ID:', companyData.id);
      
      const company: Company = {
        id: companyData.id,
        name: companyData.name,
        createdAt: new Date(companyData.created_at),
        createdBy: companyData.created_by
      };
      
      // Clear cached data and set new company with exact ID
      localStorage.removeItem('userCompanies');
      localStorage.setItem('currentCompanyId', company.id);
      
      console.log('Set current company ID in localStorage:', company.id);
      console.log('Company ID from invitation:', invitation.company_id);
      console.log('Company IDs match:', company.id === invitation.company_id);
      
      toast({
        title: "Welcome to the team!",
        description: `You are now a ${invitation.role} of ${company.name}`,
      });
      
      return { company, invitationId, role: invitation.role };
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      
      let errorMessage = "There was an error accepting the invitation";
      
      if (error.message?.includes('not found')) {
        errorMessage = "Invitation not found or has already been used";
      } else if (error.message?.includes('already a member')) {
        errorMessage = "You are already a member of this company";
      } else if (error.message?.includes('Company ID mismatch')) {
        errorMessage = "There's a company ID mismatch. Please contact support.";
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
