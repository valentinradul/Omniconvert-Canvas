
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/company/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useInvitationHandler() {
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { refreshUserIncomingInvitations } = useCompany();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessingInvitation, setIsProcessingInvitation] = useState(false);
  const [hasProcessedInvitation, setHasProcessedInvitation] = useState(false);

  const invitationId = searchParams.get('invitation');

  useEffect(() => {
    const handleInvitation = async () => {
      // Only process if we have everything we need and haven't already processed
      if (!isAuthenticated || !user?.email || !invitationId || isProcessingInvitation || hasProcessedInvitation) {
        return;
      }

      console.log('🔗 Processing invitation from URL:', { invitationId, userId: user.id, userEmail: user.email });
      setIsProcessingInvitation(true);

      try {
        // First, verify the invitation exists and matches the user's email
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
          console.error('❌ Invitation not found or invalid:', invitationError);
          toast({
            variant: "destructive",
            title: "Invalid invitation",
            description: "This invitation link is invalid or has already been used.",
          });
          navigate('/dashboard', { replace: true });
          return;
        }

        // Check email match (case-insensitive)
        if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
          console.error('❌ Email mismatch:', { invitationEmail: invitation.email, userEmail: user.email });
          toast({
            variant: "destructive",
            title: "Email mismatch",
            description: "This invitation was sent to a different email address.",
          });
          navigate('/dashboard', { replace: true });
          return;
        }

        console.log('✅ Valid invitation found, refreshing invitations list');
        setHasProcessedInvitation(true);
        
        // Refresh user incoming invitations so they can see it on the dashboard
        await refreshUserIncomingInvitations();
        
        // Show success message
        toast({
          title: "Invitation found!",
          description: `You have an invitation to join ${(invitation.companies as any)?.name || 'the company'}. Please review and accept it below.`,
        });
        
        // Clear URL parameters and redirect to dashboard
        navigate('/dashboard', { replace: true });
        
      } catch (error) {
        console.error('❌ Error processing invitation from URL:', error);
        toast({
          variant: "destructive",
          title: "Error processing invitation",
          description: "There was an error processing your invitation. Please try again.",
        });
        navigate('/dashboard', { replace: true });
      } finally {
        setIsProcessingInvitation(false);
      }
    };

    // Only run if we have an invitation ID in the URL
    if (invitationId) {
      handleInvitation();
    }
  }, [isAuthenticated, user, invitationId, refreshUserIncomingInvitations, toast, navigate, isProcessingInvitation, hasProcessedInvitation]);

  return {
    invitationId,
    isProcessingInvitation
  };
}
