
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useInvitations() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Accept invitation function - ONLY called by explicit user action (button click)
  const acceptInvitation = async (invitationId: string, userId: string | undefined, invitations: any[]) => {
    console.log('🚀 EXPLICIT USER CLICK: User clicked accept invitation button:', { invitationId, userId });
    
    if (!userId) {
      console.error('❌ No user ID provided for invitation acceptance');
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to accept the invitation",
      });
      return null;
    }
    
    if (isProcessing) {
      console.log('⏳ Already processing an invitation, preventing duplicate...');
      return null;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('🔍 Checking invitation status before accepting...');
      
      // First, get the invitation and check if it's still valid
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

      // Check if invitation is already accepted
      if (invitation.accepted) {
        console.log('ℹ️ Invitation already accepted');
        toast({
          variant: "destructive",
          title: "Invitation already accepted",
          description: "This invitation has already been accepted.",
        });
        return null;
      }
      
      console.log('✅ Found valid pending invitation for MANUAL processing:', invitation);
      
      // Check if user is already a member of this company
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
        
        // Mark invitation as accepted since user is already a member
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
      
      console.log('➕ Adding user to company members via MANUAL acceptance:', { userId, companyId: invitation.company_id, role: invitation.role });
      
      // Add user to company members
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: invitation.company_id,
          user_id: userId,
          role: invitation.role
        });
        
      if (memberError) {
        console.error('❌ Error adding company member:', memberError);
        toast({
          variant: "destructive",
          title: "Failed to join company",
          description: "There was an error adding you to the company. Please try again.",
        });
        return null;
      }
      
      console.log('✅ Successfully added user to company via MANUAL acceptance');
      
      // Grant department permissions if user is a member
      if (invitation.role === 'member' && invitation.department_permissions) {
        console.log('🏢 Setting up department permissions for member:', invitation.department_permissions);
        
        try {
          const deptPermissions = invitation.department_permissions as any;
          let departmentIds = null;
          
          if (!deptPermissions.all && deptPermissions.departmentIds && deptPermissions.departmentIds.length > 0) {
            departmentIds = deptPermissions.departmentIds;
          }
          
          const { error: permError } = await supabase.rpc('grant_department_permissions', {
            p_user_id: userId,
            p_company_id: invitation.company_id,
            p_department_ids: departmentIds
          });
          
          if (permError) {
            console.error('❌ Error setting department permissions:', permError);
            // Don't fail the whole process, just log the error
          } else {
            console.log('✅ Department permissions set successfully');
          }
        } catch (permissionError) {
          console.error('❌ Error processing department permissions:', permissionError);
          // Don't fail the whole process
        }
      }
      
      // Mark invitation as accepted - ONLY after successful member addition
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
      
      console.log('🎉 Successfully processed MANUAL invitation acceptance');
      
      toast({
        title: "Welcome to the team!",
        description: `You are now a ${invitation.role} of ${company.name}`,
      });
      
      return { company, invitationId, role: invitation.role };
    } catch (error: any) {
      console.error('❌ Error accepting invitation:', error);
      
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
      setIsProcessing(false);
    }
  };
  
  // Decline invitation function
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
    isProcessing
  };
}
