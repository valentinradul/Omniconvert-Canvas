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
      // First, check if this email is already a member of this company
      // We need to get the user ID from the profiles table first
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      // Then check if there's already a user with this email who is a member
      const { data: existingMemberByEmail } = await supabase
        .rpc('get_current_user_email')
        .then(async (emailResult) => {
          if (emailResult.data === email.toLowerCase().trim()) {
            // This is the current user trying to invite themselves
            return await supabase
              .from('company_members')
              .select('id')
              .eq('company_id', currentCompanyId)
              .eq('user_id', userId);
          }
          return { data: null };
        });

      // Check if there's already a pending invitation for this email
      const { data: existingInvites } = await supabase
        .from('company_invitations')
        .select('id, accepted')
        .eq('company_id', currentCompanyId)
        .eq('email', email.toLowerCase().trim());
        
      if (existingInvites && existingInvites.length > 0) {
        const pendingInvite = existingInvites.find(invite => !invite.accepted);
        if (pendingInvite) {
          // Update the existing invitation instead of creating a new one
          const { error: updateError } = await supabase
            .from('company_invitations')
            .update({
              role,
              department_permissions: departmentPermissions,
              invited_by: userId
            })
            .eq('id', pendingInvite.id);
            
          if (updateError) throw updateError;
          
          toast({
            title: 'Invitation updated',
            description: `Updated the existing invitation for ${email} with new permissions.`,
          });
          
          return { id: pendingInvite.id };
        }
      }
      
      // Fetch company info
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('name')
        .eq('id', currentCompanyId)
        .single();
        
      if (companyError) throw companyError;
      
      // Get inviter's profile info
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();
      
      // Create invitation record with department permissions
      const { data: invitation, error } = await supabase
        .from('company_invitations')
        .insert({
          company_id: currentCompanyId,
          email: email.toLowerCase().trim(),
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
            email: email.toLowerCase().trim(),
            companyName: companyData.name,
            inviterName: inviterProfile?.full_name || null,
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
      
      let errorMessage = error.message;
      if (error.message.includes('duplicate key value violates unique constraint')) {
        errorMessage = 'This email already has a pending invitation. Please wait for them to respond or cancel the existing invitation first.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Failed to send invitation',
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const removeMember = async (
    memberUserId: string, 
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
    
    const memberToRemove = companyMembers.find(m => m.userId === memberUserId);
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
      // First get all existing invitations for this email to delete them completely
      console.log('Starting member removal process for user:', memberUserId);
      
      // Get the company member record first
      const { data: memberData } = await supabase
        .from('company_members')
        .select('id')
        .eq('user_id', memberUserId)
        .eq('company_id', currentCompanyId)
        .single();

      if (memberData) {
        // Remove department permissions first
        const { error: deptPermError } = await supabase
          .from('member_department_permissions')
          .delete()
          .eq('member_id', memberData.id);
          
        if (deptPermError) {
          console.warn('Error cleaning up department permissions:', deptPermError);
        }
      }

      // Remove the company membership
      const { error } = await supabase
        .from('company_members')
        .delete()
        .eq('user_id', memberUserId)
        .eq('company_id', currentCompanyId);
        
      if (error) throw error;

      // Clean up ALL invitations for this company and user combination
      // Method 1: Clean up invitations created BY this user
      const { error: inviterCleanupError } = await supabase
        .from('company_invitations')
        .delete()
        .eq('company_id', currentCompanyId)
        .eq('invited_by', memberUserId);
        
      if (inviterCleanupError) {
        console.warn('Error cleaning up invitations created by user:', inviterCleanupError);
      }

      // Method 2: Try to find and clean up invitations FOR this user
      // We need to find the user's email to clean up invitations sent TO them
      try {
        // Try to get user's email from profiles or member data
        const member = companyMembers.find(m => m.userId === memberUserId);
        let userEmail = null;
        
        if (member?.profile?.email) {
          userEmail = member.profile.email;
        } else {
          // Try to get from auth (this might not work for other users)
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(memberUserId);
            userEmail = authUser.user?.email;
          } catch (authError) {
            console.warn('Could not get user email from auth:', authError);
          }
        }

        if (userEmail) {
          console.log('Cleaning up invitations for email:', userEmail);
          const { error: emailCleanupError } = await supabase
            .from('company_invitations')
            .delete()
            .eq('company_id', currentCompanyId)
            .eq('email', userEmail.toLowerCase().trim());
            
          if (emailCleanupError) {
            console.warn('Error cleaning up invitations by email:', emailCleanupError);
          }
        } else {
          console.warn('Could not determine user email for invitation cleanup');
        }
      } catch (emailLookupError) {
        console.warn('Error during email lookup for invitation cleanup:', emailLookupError);
      }

      toast({
        title: 'Member removed',
        description: 'The member has been removed from the company.',
      });
      
      return memberUserId;
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
