
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useInvitations } from '@/context/company/useInvitations';
import { useCompany } from '@/context/company/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useInvitationHandler() {
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { acceptInvitation } = useInvitations();
  const { switchCompany, refreshUserCompanies } = useCompany();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessingInvitation, setIsProcessingInvitation] = useState(false);
  const [hasProcessedInvitation, setHasProcessedInvitation] = useState(false);

  const invitationId = searchParams.get('invitation');

  useEffect(() => {
    const handleInvitation = async () => {
      // Only process if:
      // 1. User is authenticated
      // 2. We have an invitation ID
      // 3. We haven't already processed this invitation
      // 4. We're not currently processing
      if (!isAuthenticated || !user || !invitationId || isProcessingInvitation || hasProcessedInvitation) {
        return;
      }

      console.log('Processing invitation for authenticated user:', { invitationId, userId: user.id, userEmail: user.email });
      setIsProcessingInvitation(true);

      try {
        // First, verify the invitation exists and is valid
        const { data: invitation, error: invitationError } = await supabase
          .from('company_invitations')
          .select(`
            id,
            company_id,
            email,
            role,
            accepted,
            companies (
              id,
              name
            )
          `)
          .eq('id', invitationId)
          .single();

        if (invitationError || !invitation) {
          console.error('Invitation not found or invalid:', invitationError);
          toast({
            variant: "destructive",
            title: "Invalid invitation",
            description: "This invitation link is invalid or no longer available.",
          });
          navigate('/dashboard', { replace: true });
          return;
        }

        console.log('Found invitation:', invitation);

        // Check if the invitation email matches the current user's email
        if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
          console.error('Email mismatch:', { invitationEmail: invitation.email, userEmail: user.email });
          toast({
            variant: "destructive",
            title: "Email mismatch",
            description: "This invitation was sent to a different email address.",
          });
          navigate('/dashboard', { replace: true });
          return;
        }

        // Check if user is already a member of this company
        const { data: existingMember, error: memberCheckError } = await supabase
          .from('company_members')
          .select('id, role, company_id')
          .eq('user_id', user.id)
          .eq('company_id', invitation.company_id)
          .maybeSingle();

        if (memberCheckError) {
          console.error('Error checking existing membership:', memberCheckError);
          throw new Error('Unable to verify membership status');
        }

        if (existingMember) {
          console.log('User is already a member of this company');
          
          // Mark invitation as accepted
          await supabase
            .from('company_invitations')
            .update({ accepted: true })
            .eq('id', invitationId);
            
          toast({
            title: "Welcome back!",
            description: `You're already a member of ${(invitation.companies as any)?.name || 'this company'}`,
          });
        } else if (!invitation.accepted) {
          console.log('Accepting invitation...');

          // Accept the invitation
          const result = await acceptInvitation(invitationId, user.id, [invitation]);
          
          if (!result) {
            throw new Error('Failed to accept invitation');
          }

          console.log('Invitation accepted successfully');
          setHasProcessedInvitation(true);
          
          toast({
            title: "Welcome to the team!",
            description: `You've successfully joined ${(invitation.companies as any)?.name || 'the company'}`,
          });
        }

        // Force refresh user companies to get the updated list
        console.log('Refreshing user companies...');
        await refreshUserCompanies();
        
        // Wait for companies to be refreshed
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Switch to the company
        console.log('Switching to company with ID:', invitation.company_id);
        switchCompany(invitation.company_id);
        
        // Clear URL parameters and redirect to dashboard
        setTimeout(() => {
          window.history.replaceState({}, '', '/dashboard');
          navigate('/dashboard', { replace: true });
        }, 1000);
        
      } catch (error) {
        console.error('Error processing invitation:', error);
        toast({
          variant: "destructive",
          title: "Error processing invitation",
          description: "There was an error processing your invitation. Please try again.",
        });
      } finally {
        setIsProcessingInvitation(false);
      }
    };

    handleInvitation();
  }, [isAuthenticated, user, invitationId, acceptInvitation, switchCompany, refreshUserCompanies, toast, navigate, isProcessingInvitation, hasProcessedInvitation]);

  return {
    invitationId,
    isProcessingInvitation
  };
}
