
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useInvitationHandler() {
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessingInvitation, setIsProcessingInvitation] = useState(false);
  const [hasProcessedInvitation, setHasProcessedInvitation] = useState(false);

  const invitationId = searchParams.get('invitation');

  useEffect(() => {
    const handleInvitation = async () => {
      // Only validate invitation existence, don't auto-accept
      if (!isAuthenticated || !user?.email || !invitationId || isProcessingInvitation || hasProcessedInvitation) {
        return;
      }

      console.log('🔗 Validating invitation from URL:', { invitationId, userId: user.id, userEmail: user.email });
      setIsProcessingInvitation(true);

      try {
        // Just validate that the invitation exists and is for this user
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

        console.log('✅ Valid invitation found - user can accept it manually on dashboard');
        setHasProcessedInvitation(true);
        
        // Show success message that invitation is available
        toast({
          title: "Invitation ready",
          description: `You have a pending invitation to join ${(invitation.companies as any)?.name || 'the company'}. Check your dashboard to accept it.`,
        });
        
        // Navigate to dashboard without auto-accepting
        navigate('/dashboard', { replace: true });
        
      } catch (error) {
        console.error('❌ Error validating invitation from URL:', error);
        toast({
          variant: "destructive",
          title: "Error validating invitation",
          description: "There was an error validating your invitation. Please try again.",
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
  }, [isAuthenticated, user, invitationId, toast, navigate, isProcessingInvitation, hasProcessedInvitation]);

  return {
    invitationId,
    isProcessingInvitation
  };
}
