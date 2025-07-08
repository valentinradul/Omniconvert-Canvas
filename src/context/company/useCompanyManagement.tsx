import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
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
    userCompanyRole: CompanyRole | null,
    departmentPermissions: string[] = []
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
      // First, check if there's already a pending invitation for this email
      const { data: existingInvites } = await supabase
        .from('company_invitations')
        .select('id')
        .eq('company_id', currentCompanyId)
        .eq('email', email)
        .eq('accepted', false);
        
      if (existingInvites && existingInvites.length > 0) {
        throw new Error('This email already has a pending invitation');
      }
      
      // Fetch company info
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('name')
        .eq('id', currentCompanyId)
        .single();
        
      if (companyError) throw companyError;
      
      // Get inviter's profile info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();
      
      // Create invitation record with department permissions
      const { data: invitation, error } = await supabase
        .from('company_invitations')
        .insert({
          company_id: currentCompanyId,
          email,
          role,
          invited_by: userId,
          department_permissions: departmentPermissions
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Send invitation email
      try {
        console.log("Calling send-invitation edge function");
        const { error: fnError } = await supabase.functions.invoke('send-invitation', {
          body: {
            email,
            companyName: companyData.name,
            inviterName: profileData?.full_name || null,
            role,
            invitationId: invitation.id,
            departmentPermissions
          }
        });
        
        if (fnError) {
          console.error('Error from edge function:', fnError);
          throw new Error(`Email service error: ${fnError.message}`);
        }
        
        console.log('Invitation email sent successfully');
      } catch (emailError: any) {
        console.error('Error sending invitation email:', emailError);
        toast({
          variant: 'destructive',
          title: 'Invitation created with warning',
          description: `Invitation created but there was an issue sending the email: ${emailError.message}`,
        });
        return invitation;
      }
      
      toast({
        title: 'Invitation sent',
        description: `An invitation has been sent to ${email}.`,
      });
      
      return invitation;
    } catch (error: any) {
      console.error('Error inviting member:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to send invitation',
        description: error.message,
      });
      throw error;
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

  const unsendInvitation = async (
    invitationId: string,
    currentCompanyId: string | undefined,
    userCompanyRole: CompanyRole | null
  ) => {
    if (!currentCompanyId || !userCompanyRole || (userCompanyRole !== 'owner' && userCompanyRole !== 'admin')) {
      toast({
        variant: 'destructive',
        title: 'Permission denied',
        description: 'You don\'t have permission to unsend invitations.',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('company_invitations')
        .delete()
        .eq('id', invitationId)
        .eq('company_id', currentCompanyId);
        
      if (error) throw error;
      
      toast({
        title: 'Invitation unsent',
        description: 'The invitation has been successfully removed.',
      });
      
      return invitationId;
    } catch (error: any) {
      console.error('Error unsending invitation:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to unsend invitation',
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
    unsendInvitation,
    isProcessing
  };
};
