
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Company, CompanyInvitation, CompanyRole } from '@/types';

export const useInvitations = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const acceptInvitation = async (
    invitationId: string, 
    userId: string | undefined,
    invitations: CompanyInvitation[]
  ) => {
    if (!userId) return;
    
    const invitation = invitations.find(i => i.id === invitationId);
    if (!invitation) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Invitation not found.',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { error: inviteError } = await supabase
        .from('company_invitations')
        .update({ accepted: true })
        .eq('id', invitationId);
        
      if (inviteError) throw inviteError;
      
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: invitation.companyId,
          user_id: userId,
          role: invitation.role
        });
        
      if (memberError) throw memberError;
      
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
        title: 'Invitation accepted',
        description: `You've successfully joined ${company.name}.`,
      });
      
      return { company, invitationId, role: invitation.role };
    } catch (error: any) {
      console.error('Error accepting invitation:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to accept invitation',
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const declineInvitation = async (invitationId: string) => {
    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('company_invitations')
        .delete()
        .eq('id', invitationId);
        
      if (error) throw error;
      
      toast({
        title: 'Invitation declined',
        description: 'The invitation has been declined.',
      });
      
      return invitationId;
    } catch (error: any) {
      console.error('Error declining invitation:', error.message);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to decline invitation.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    acceptInvitation,
    declineInvitation,
    isProcessing
  };
};
