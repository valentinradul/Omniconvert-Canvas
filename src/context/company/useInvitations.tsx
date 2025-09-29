
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useInvitations() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

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
      
      console.log('✅ Found valid pending invitation for MANUAL processing:', invitation);
      
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
      
      console.log('➕ Adding user to company members via MANUAL acceptance:', { 
        userId, 
        companyId: invitation.company_id, 
        role: invitation.role,
        invitationData: invitation 
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
        console.error('❌ Full error details:', JSON.stringify(memberError, null, 2));
        console.error('❌ Attempted to insert:', { 
          company_id: invitation.company_id, 
          user_id: userId, 
          role: invitation.role 
        });
        
        // More specific error messages based on error type
        let errorMessage = "There was an error adding you to the company. Please try again.";
        
        if (memberError.code === '23514') {
          if (memberError.message?.includes('company_members_role_check')) {
            errorMessage = `The role "${invitation.role}" is not supported. Please contact your administrator.`;
          }
        } else if (memberError.code === '23505') {
          errorMessage = "You are already a member of this company.";
        }
        
        toast({
          variant: "destructive",
          title: "Failed to join company",
          description: errorMessage,
        });
        return null;
      }
      
      console.log('✅ Successfully added user to company via MANUAL acceptance');
      
      // Handle department permissions for members
      if (invitation.role === 'member' && invitation.department_permissions && Array.isArray(invitation.department_permissions) && invitation.department_permissions.length > 0) {
        console.log('🏢 Setting up department permissions for member:', invitation.department_permissions);
        
        const departmentPermissions = invitation.department_permissions.map((deptId: string) => ({
          member_id: newMember.id,
          department_id: deptId
        }));
        
        const { error: permissionError } = await supabase
          .from('member_department_permissions')
          .insert(departmentPermissions);
          
        if (permissionError) {
          console.error('❌ Error setting department permissions:', permissionError);
          // Don't fail the invitation for this, just log it
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
