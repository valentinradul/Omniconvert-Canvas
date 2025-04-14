
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CompanyRole } from '@/types';

export const useCompanyManagement = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const inviteMember = async (
    email: string, 
    role: CompanyRole, 
    currentCompanyId: string | undefined, 
    userId: string | undefined, 
    userCompanyRole: CompanyRole | null
  ) => {
    if (!userId || !currentCompanyId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must select a company first.',
      });
      return;
    }
    
    if (userCompanyRole !== 'owner' && userCompanyRole !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'Permission denied',
        description: 'Only owners and admins can invite new members.',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase
        .from('company_invitations')
        .insert({
          company_id: currentCompanyId,
          email,
          role,
          invited_by: userId
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: 'Invitation sent',
        description: `An invitation has been sent to ${email}.`,
      });
      
      return data;
    } catch (error: any) {
      console.error('Error inviting member:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to send invitation',
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeMember = async (
    userId: string, 
    currentCompanyId: string | undefined, 
    userCompanyRole: CompanyRole | null,
    companyMembers: any[]
  ) => {
    if (!currentCompanyId || !userCompanyRole || (userCompanyRole !== 'owner' && userCompanyRole !== 'admin')) {
      toast({
        variant: 'destructive',
        title: 'Permission denied',
        description: 'You don\'t have permission to remove members.',
      });
      return;
    }
    
    const memberToRemove = companyMembers.find(m => m.userId === userId);
    if (memberToRemove?.role === 'owner') {
      toast({
        variant: 'destructive',
        title: 'Action not allowed',
        description: 'You cannot remove the company owner.',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('company_members')
        .delete()
        .eq('user_id', userId)
        .eq('company_id', currentCompanyId);
        
      if (error) throw error;
      
      toast({
        title: 'Member removed',
        description: 'The member has been removed from the company.',
      });
      
      return userId;
    } catch (error: any) {
      console.error('Error removing member:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to remove member',
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateMemberRole = async (
    userId: string, 
    role: CompanyRole,
    currentCompanyId: string | undefined,
    userCompanyRole: CompanyRole | null
  ) => {
    if (!currentCompanyId || !userCompanyRole || userCompanyRole !== 'owner') {
      toast({
        variant: 'destructive',
        title: 'Permission denied',
        description: 'Only the company owner can change member roles.',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('company_members')
        .update({ role })
        .eq('user_id', userId)
        .eq('company_id', currentCompanyId);
        
      if (error) throw error;
      
      toast({
        title: 'Role updated',
        description: 'The member\'s role has been updated successfully.',
      });
      
      return { userId, role };
    } catch (error: any) {
      console.error('Error updating role:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to update role',
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    inviteMember,
    removeMember,
    updateMemberRole,
    isProcessing
  };
};
