
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
    // Only show a notification about pending invitation, don't auto-process anything
    const showInvitationNotification = async () => {
      if (!isAuthenticated || !user?.email || !invitationId || isProcessingInvitation || hasProcessedInvitation) {
        return;
      }

      console.log('🔗 Invitation ID found in URL, showing notification only:', { invitationId, userId: user.id, userEmail: user.email });
      setIsProcessingInvitation(true);

      try {
        // Just check that the invitation exists and is for this user - don't validate or process it
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
          console.log('ℹ️ Invitation not found or invalid, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
          return;
        }

        // Check email match (case-insensitive)
        if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
          console.log('ℹ️ Email mismatch, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
          return;
        }

        console.log('✅ Valid invitation found - user will see it on dashboard');
        setHasProcessedInvitation(true);
        
        // Show notification that invitation is available on dashboard
        toast({
          title: "Invitation available",
          description: `You have a pending invitation to join ${(invitation.companies as any)?.name || 'the company'}. Check your dashboard to accept it.`,
        });
        
        // Navigate to dashboard - the invitation will be shown there for manual acceptance
        navigate('/dashboard', { replace: true });
        
      } catch (error) {
        console.error('❌ Error checking invitation from URL:', error);
        navigate('/dashboard', { replace: true });
      } finally {
        setIsProcessingInvitation(false);
      }
    };

    // Only run if we have an invitation ID in the URL
    if (invitationId) {
      showInvitationNotification();
    }
  }, [isAuthenticated, user, invitationId, toast, navigate, isProcessingInvitation, hasProcessedInvitation]);

  return {
    invitationId,
    isProcessingInvitation
  };
}
