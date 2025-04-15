
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
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
      
      toast({
        title: "Invitation accepted",
        description: `You are now a member of ${company.name}`,
      });
      
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
