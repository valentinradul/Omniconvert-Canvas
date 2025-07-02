
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
    // ONLY validate and show notification about invitation - NO AUTOMATIC PROCESSING
    const handleInvitationInUrl = async () => {
      if (!isAuthenticated || !user?.email || !invitationId || hasProcessedInvitation) {
        return;
      }

      console.log('🔗 Invitation ID found in URL, validating invitation only (NO AUTO-PROCESSING):', { invitationId, userId: user.id, userEmail: user.email });
      setIsProcessingInvitation(true);

      try {
        // Just validate that the invitation exists and is for this user - DO NOT PROCESS IT
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
          console.log('ℹ️ Invitation not found, expired, or already accepted - redirecting to dashboard');
          navigate('/dashboard', { replace: true });
          return;
        }

        // Validate email match (case-insensitive)
        if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
          console.log('ℹ️ Email mismatch for invitation - redirecting to dashboard');
          navigate('/dashboard', { replace: true });
          return;
        }

        console.log('✅ Valid invitation found - showing notification (NO AUTO-PROCESSING)');
        setHasProcessedInvitation(true);
        
        // Show notification that invitation is available on dashboard - DO NOT AUTO-ACCEPT
        toast({
          title: "Invitation pending",
          description: `You have a pending invitation to join ${(invitation.companies as any)?.name || 'the company'}. Go to your dashboard to accept or decline it.`,
        });
        
        // Navigate to dashboard - invitation will be shown there for MANUAL acceptance
        navigate('/dashboard', { replace: true });
        
      } catch (error) {
        console.error('❌ Error validating invitation from URL:', error);
        navigate('/dashboard', { replace: true });
      } finally {
        setIsProcessingInvitation(false);
      }
    };

    // Only run if we have an invitation ID in the URL and haven't processed it yet
    if (invitationId && !hasProcessedInvitation) {
      handleInvitationInUrl();
    }
  }, [isAuthenticated, user, invitationId, toast, navigate, hasProcessedInvitation]);

  return {
    invitationId,
    isProcessingInvitation
  };
}
