
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useInvitations() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const acceptInvitation = async (invitationId: string, userId: string | undefined, invitations: any[], attempt = 1): Promise<any> => {
    console.log(`🚀 Accept invitation attempt ${attempt}/${MAX_RETRIES}:`, { invitationId, userId });
    
    if (!userId) {
      console.error('❌ No user ID provided for invitation acceptance');
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to accept the invitation",
      });
      return null;
    }
    
    if (isProcessing && attempt === 1) {
      console.log('⏳ Already processing an invitation, preventing duplicate...');
      return null;
    }
    
    if (attempt === 1) {
      setIsProcessing(true);
      setRetryCount(0);
    }
    
    try {
      console.log('🔍 Checking invitation status before accepting...');
      
      const { data: invitation, error: invitationError } = await supabase
        .from('company_invitations')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .eq('id', invitationId)
        .single();
        
      if (invitationError) {
        console.error('❌ Error fetching invitation:', invitationError);
        toast({
          variant: "destructive",
          title: "Invitation not found",
          description: "This invitation may have been removed or is invalid.",
        });
        return null;
      }

      if (!invitation) {
        console.error('❌ Invitation not found');
        toast({
          variant: "destructive",
          title: "Invitation not found",
          description: "This invitation may have been removed or is invalid.",
        });
        return null;
      }

      if (invitation.accepted) {
        console.log('ℹ️ Invitation already accepted');
        toast({
          variant: "destructive",
          title: "Invitation already accepted",
          description: "This invitation has already been accepted.",
        });
        return null;
      }
      
      console.log('✅ Found valid pending invitation:', invitation);
      
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('company_members')
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', invitation.company_id)
        .maybeSingle();
        
      if (memberCheckError) {
        console.error('❌ Error checking existing membership:', memberCheckError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Unable to verify membership status. Please try again.",
        });
        return null;
      }
      
      if (existingMember) {
        console.log('ℹ️ User is already a member of this company - marking invitation as accepted');
        
        const { error: updateError } = await supabase
          .from('company_invitations')
          .update({ accepted: true })
          .eq('id', invitationId)
          .eq('email', invitation.email);
          
        if (updateError) {
          console.error('❌ Error updating invitation status:', updateError);
        } else {
          console.log('✅ Marked invitation as accepted for existing member');
        }
        
        toast({
          title: "Already a member",
          description: "You are already a member of this company.",
        });
        
        return null;
      }
      
      console.log('➕ Adding user to company members:', { 
        userId, 
        companyId: invitation.company_id, 
        role: invitation.role
      });
      
      // Add user to company members
      const { data: newMember, error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: invitation.company_id,
          user_id: userId,
          role: invitation.role
        })
        .select()
        .single();
        
      if (memberError) {
        console.error('❌ Error adding company member:', memberError);
        console.error('❌ Error code:', memberError.code);
        
        // Check if it's an RLS error and retry
        if (memberError.code === '42501' || memberError.message?.includes('row-level security')) {
          if (attempt < MAX_RETRIES) {
            console.log(`🔄 RLS error detected, retrying in ${RETRY_DELAY}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
            setRetryCount(attempt);
            
            toast({
              title: "Retrying...",
              description: `Attempt ${attempt + 1} of ${MAX_RETRIES}. Please wait...`,
            });
            
            await sleep(RETRY_DELAY * attempt); // Exponential backoff
            return acceptInvitation(invitationId, userId, invitations, attempt + 1);
          } else {
            console.error('❌ Max retries reached for RLS error');
            toast({
              variant: "destructive",
              title: "Permission error",
              description: "Unable to add you to the company due to a permissions issue. Please contact your administrator or try again later.",
            });
            return null;
          }
        }
        
        // Handle specific error types
        let errorMessage = "There was an error adding you to the company. Please try again.";
        
        if (memberError.code === '23514') {
          if (memberError.message?.includes('company_members_role_check')) {
            errorMessage = `The role "${invitation.role}" is not supported. Please contact your administrator.`;
          }
        } else if (memberError.code === '23505') {
          errorMessage = "You are already a member of this company.";
        } else if (memberError.code === '42501') {
          errorMessage = "Permission denied. Please ensure you are logged in and try again.";
        }
        
        toast({
          variant: "destructive",
          title: "Failed to join company",
          description: errorMessage,
        });
        return null;
      }
      
      console.log('✅ Successfully added user to company');
      
      // Handle department permissions for members
      if (invitation.role === 'member' && invitation.department_permissions && Array.isArray(invitation.department_permissions) && invitation.department_permissions.length > 0) {
        console.log('🏢 Setting up department permissions:', invitation.department_permissions);
        
        const departmentPermissions = invitation.department_permissions.map((deptId: string) => ({
          member_id: newMember.id,
          department_id: deptId
        }));
        
        const { error: permissionError } = await supabase
          .from('member_department_permissions')
          .insert(departmentPermissions);
          
        if (permissionError) {
          console.error('❌ Error setting department permissions:', permissionError);
        } else {
          console.log('✅ Department permissions set successfully');
        }
      }
      
      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('company_invitations')
        .update({ accepted: true })
        .eq('id', invitationId)
        .eq('email', invitation.email);
        
      if (updateError) {
        console.error('❌ Error updating invitation status:', updateError);
        console.warn('⚠️ Failed to mark invitation as accepted, but user was added to company');
      } else {
        console.log('✅ Successfully marked invitation as accepted');
      }
      
      const company = {
        id: invitation.company_id,
        name: (invitation.companies as any)?.name || 'Unknown Company',
        createdAt: new Date(),
        createdBy: invitation.invited_by
      };
      
      console.log('🎉 Successfully processed invitation acceptance');
      
      toast({
        title: "Welcome to the team!",
        description: `You are now a ${invitation.role} of ${company.name}`,
      });
      
      return { company, invitationId, role: invitation.role };
    } catch (error: any) {
      console.error('❌ Error accepting invitation:', error);
      
      // Retry on network errors
      if (attempt < MAX_RETRIES && (error.message?.includes('network') || error.message?.includes('fetch'))) {
        console.log(`🔄 Network error, retrying in ${RETRY_DELAY}ms...`);
        setRetryCount(attempt);
        
        toast({
          title: "Connection issue",
          description: `Retrying... (attempt ${attempt + 1} of ${MAX_RETRIES})`,
        });
        
        await sleep(RETRY_DELAY * attempt);
        return acceptInvitation(invitationId, userId, invitations, attempt + 1);
      }
      
      let errorMessage = "There was an error accepting the invitation";
      
      if (error.message?.includes('not found') || error.message?.includes('duplicate')) {
        errorMessage = "Invitation not found or has already been used";
      } else if (error.message?.includes('already a member')) {
        errorMessage = "You are already a member of this company";  
      } else if (error.code === 'PGRST106') {
        errorMessage = "Invitation not found or has already been used";
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
      if (attempt >= MAX_RETRIES || attempt === 1) {
        setIsProcessing(false);
        setRetryCount(0);
      }
    }
  };
  
  const declineInvitation = async (invitationId: string) => {
    console.log('❌ User clicked decline invitation:', invitationId);
    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('company_invitations')
        .delete()
        .eq('id', invitationId);
        
      if (error) {
        console.error('❌ Error declining invitation:', error);
        throw error;
      }
      
      console.log('✅ Successfully declined invitation');
      
      toast({
        title: "Invitation declined",
        description: "The invitation has been declined",
      });
      
      return invitationId;
    } catch (error: any) {
      console.error('❌ Error declining invitation:', error);
      
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
    isProcessing,
    retryCount
  };
}
