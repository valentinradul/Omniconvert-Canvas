
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
      console.log('🔍 Using database function to accept invitation...');
      
      // Use the secure database function that handles all the logic
      const { data, error } = await supabase.rpc('accept_company_invitation', {
        invitation_id_param: invitationId,
        accepting_user_id: userId
      });
      
      if (error) {
        console.error('❌ Error calling accept_company_invitation:', error);
        
        // Retry on RLS or network errors
        if (attempt < MAX_RETRIES && (error.code === '42501' || error.message?.includes('network') || error.message?.includes('fetch'))) {
          console.log(`🔄 Error detected, retrying in ${RETRY_DELAY * attempt}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
          setRetryCount(attempt);
          
          toast({
            title: "Retrying...",
            description: `Attempt ${attempt + 1} of ${MAX_RETRIES}. Please wait...`,
          });
          
          await sleep(RETRY_DELAY * attempt);
          return acceptInvitation(invitationId, userId, invitations, attempt + 1);
        }
        
        toast({
          variant: "destructive",
          title: "Failed to join company",
          description: error.message || "There was an error adding you to the company. Please try again.",
        });
        return null;
      }
      
      console.log('📦 Database function response:', data);
      
      const result = data as { status: string; message: string; company_id?: string; company_name?: string; role?: string; member_id?: string };
      
      if (result.status === 'error') {
        console.error('❌ Function returned error:', result.message);
        toast({
          variant: "destructive",
          title: "Failed to join company",
          description: result.message,
        });
        return null;
      }
      
      if (result.status === 'already_accepted') {
        toast({
          variant: "destructive",
          title: "Invitation already accepted",
          description: result.message,
        });
        return null;
      }
      
      if (result.status === 'already_member') {
        toast({
          title: "Already a member",
          description: result.message,
        });
        // Return company info so UI can update
        return {
          company: {
            id: result.company_id,
            name: result.company_name,
          },
          invitationId,
          role: result.role || 'member'
        };
      }
      
      // Success!
      console.log('🎉 Successfully joined company');
      
      toast({
        title: "Welcome to the team!",
        description: `You are now a ${result.role} of ${result.company_name}`,
      });
      
      return {
        company: {
          id: result.company_id,
          name: result.company_name,
        },
        invitationId,
        role: result.role
      };
      
    } catch (error: any) {
      console.error('❌ Error accepting invitation:', error);
      
      // Retry on network errors
      if (attempt < MAX_RETRIES && (error.message?.includes('network') || error.message?.includes('fetch'))) {
        console.log(`🔄 Network error, retrying in ${RETRY_DELAY * attempt}ms...`);
        setRetryCount(attempt);
        
        toast({
          title: "Connection issue",
          description: `Retrying... (attempt ${attempt + 1} of ${MAX_RETRIES})`,
        });
        
        await sleep(RETRY_DELAY * attempt);
        return acceptInvitation(invitationId, userId, invitations, attempt + 1);
      }
      
      toast({
        variant: "destructive",
        title: "Failed to accept invitation",
        description: error.message || "There was an error accepting the invitation",
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
