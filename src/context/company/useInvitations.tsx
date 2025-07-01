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
      // Find the invitation in the passed invitations array first
      const localInvitation = invitations.find(inv => inv.id === invitationId);
      
      if (!localInvitation) {
        console.error('❌ Invitation not found in local data');
        throw new Error("Invitation not found");
      }
      
      console.log('✅ Found invitation in local data:', localInvitation);
      
      // Get the company ID from the invitation (handle both companyId and company_id)
      const companyId = localInvitation.companyId || localInvitation.company_id;
      
      if (!companyId) {
        console.error('❌ No company ID found in invitation:', localInvitation);
        throw new Error("Invalid invitation - missing company information");
      }
      
      console.log('🔍 Checking membership for company:', companyId);
      
      // Check if user is already a member of this company
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('company_members')
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .maybeSingle();
        
      if (memberCheckError) {
        console.error('❌ Error checking existing membership:', memberCheckError);
        throw new Error("Unable to verify membership status");
      }
      
      if (existingMember) {
        console.log('ℹ️ User is already a member of this company');
        
        // Update existing membership role if different
        if (existingMember.role !== localInvitation.role) {
          console.log('🔄 Updating member role from', existingMember.role, 'to', localInvitation.role);
          
          const { error: updateError } = await supabase
            .from('company_members')
            .update({ role: localInvitation.role })
            .eq('id', existingMember.id);
            
          if (updateError) {
            console.error('❌ Error updating member role:', updateError);
            throw updateError;
          }
        }
      } else {
        console.log('➕ Adding user to company members:', { userId, companyId, role: localInvitation.role });
        
        // Add user to company members
        const { error: memberError } = await supabase
          .from('company_members')
          .insert({
            company_id: companyId,
            user_id: userId,
            role: localInvitation.role
          });
          
        if (memberError) {
          console.error('❌ Error adding company member:', memberError);
          throw memberError;
        }
        
        console.log('✅ Successfully added user to company');
      }
      
      // Mark invitation as accepted - use a simple update without selecting
      const { error: updateError } = await supabase
        .from('company_invitations')
        .update({ accepted: true })
        .eq('id', invitationId)
        .eq('email', localInvitation.email); // Add email filter to avoid RLS issues
        
      if (updateError) {
        console.error('❌ Error updating invitation status:', updateError);
        console.warn('⚠️ Failed to mark invitation as accepted, but user was added to company');
      }
      
      const company = {
        id: companyId,
        name: localInvitation.companyName || localInvitation.company_name || 'Unknown Company',
        createdAt: new Date(),
        createdBy: localInvitation.invited_by
      };
      
      console.log('🎉 Successfully processed invitation acceptance');
      
      toast({
        title: "Welcome to the team!",
        description: `You are now a ${localInvitation.role} of ${company.name}`,
      });
      
      return { company, invitationId, role: localInvitation.role };
    } catch (error: any) {
      console.error('❌ Error accepting invitation:', error);
      
      let errorMessage = "There was an error accepting the invitation";
      
      if (error.message?.includes('not found')) {
        errorMessage = "Invitation not found or has already been used";
      } else if (error.message?.includes('already a member')) {
        errorMessage = "You are already a member of this company";
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
