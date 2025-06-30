
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useInvitations } from '@/context/company/useInvitations';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useInvitationHandler() {
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { acceptInvitation } = useInvitations();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessingInvitation, setIsProcessingInvitation] = useState(false);

  const invitationId = searchParams.get('invitation');

  useEffect(() => {
    const handleInvitation = async () => {
      // Only process if user is authenticated and we have an invitation ID
      if (!isAuthenticated || !user || !invitationId || isProcessingInvitation) {
        return;
      }

      console.log('Processing invitation for authenticated user:', { invitationId, userId: user.id });
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
          .eq('accepted', false)
          .single();

        if (invitationError || !invitation) {
          console.error('Invitation not found or invalid:', invitationError);
          toast({
            variant: "destructive",
            title: "Invalid invitation",
            description: "This invitation link is invalid or has already been used.",
          });
          navigate('/dashboard');
          return;
        }

        // Check if the invitation email matches the current user's email
        if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
          console.error('Email mismatch:', { invitationEmail: invitation.email, userEmail: user.email });
          toast({
            variant: "destructive",
            title: "Email mismatch",
            description: "This invitation was sent to a different email address.",
          });
          navigate('/dashboard');
          return;
        }

        console.log('Valid invitation found, accepting:', invitation);

        // Accept the invitation
        const result = await acceptInvitation(invitationId, user.id, [invitation]);
        
        if (result) {
          console.log('Invitation accepted successfully');
          toast({
            title: "Welcome to the team!",
            description: `You've successfully joined ${(invitation.companies as any)?.name || 'the company'}`,
          });
          
          // Clear the invitation parameter from URL and redirect to dashboard
          navigate('/dashboard', { replace: true });
        }
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
  }, [isAuthenticated, user, invitationId, acceptInvitation, toast, navigate, isProcessingInvitation]);

  return {
    invitationId,
    isProcessingInvitation
  };
}
