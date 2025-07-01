import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useInvitations() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Accept invitation function
  const acceptInvitation = async (invitationId: string, userId: string | undefined, invitations: any[]) => {
    console.log('🚀 Starting invitation acceptance process:', { invitationId, userId });
    
    if (!userId) {
      console.error('❌ No user ID provided for invitation acceptance');
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to accept the invitation",
      });
      return null;
    }
    
    setIsProcessing(true);
    
    try {
      // Get invitation data from database to ensure we have the latest info
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
        .eq('accepted', false)
        .single();
        
      if (invitationError || !invitation) {
        console.error('❌ Invitation not found or already accepted:', invitationError);
        throw new Error("Invitation not found or already used");
      }
      
      console.log('✅ Found valid invitation:', invitation);
      
      // Try to add user to company members with better error handling
      console.log('➕ Adding user to company members:', { userId, companyId: invitation.company_id, role: invitation.role });
      
      const { data: insertData, error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: invitation.company_id,
          user_id: userId,
          role: invitation.role
        })
        .select()
        .single();
        
      if (memberError) {
        // If it's a duplicate key error, that's okay - user is already a member
        if (memberError.code === '23505') {
          console.log('ℹ️ User is already a member of this company');
          // Still mark invitation as accepted even if user was already a member
        } else {
          console.error('❌ Error adding company member:', memberError);
          // Check if it's a permission error and provide better feedback
          if (memberError.message?.includes('permission denied')) {
            throw new Error("Permission denied - please contact an administrator");
          }
          throw memberError;
        }
      } else {
        console.log('✅ Successfully added user to company:', insertData);
      }
      
      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('company_invitations')
        .update({ accepted: true })
        .eq('id', invitationId);
        
      if (updateError) {
        console.error('❌ Error updating invitation status:', updateError);
        console.warn('⚠️ Failed to mark invitation as accepted, but user was added to company');
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
      
      let errorMessage = "There was an error accepting the invitation";
      
      if (error.message?.includes('not found')) {
        errorMessage = "Invitation not found or has already been used";
      } else if (error.message?.includes('already a member')) {
        errorMessage = "You are already a member of this company";
      } else if (error.message?.includes('Permission denied')) {
        errorMessage = "Permission denied - please contact an administrator";
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
    console.log('❌ Declining invitation:', invitationId);
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
