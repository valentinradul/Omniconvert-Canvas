
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

        console.log('✅ Valid invitation found, accepting...');
        
        // Accept the invitation using the existing hook
        const result = await acceptInvitation(invitationId, user.id, [invitation]);
        
        if (result) {
          console.log('🎉 Invitation accepted from URL');
          setHasProcessedInvitation(true);
          
          // Refresh user companies and switch to the new company
          await refreshUserCompanies();
          
          // Small delay to ensure data is refreshed
          setTimeout(() => {
            switchCompany(invitation.company_id);
            toast({
              title: "Welcome to the team!",
              description: `You've successfully joined ${(invitation.companies as any)?.name || 'the company'}`,
            });
            
            // Clear URL parameters and redirect
            navigate('/dashboard', { replace: true });
          }, 1000);
        }
        
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
  }, [isAuthenticated, user, invitationId, acceptInvitation, switchCompany, refreshUserCompanies, toast, navigate, isProcessingInvitation, hasProcessedInvitation]);

  return {
    invitationId,
    isProcessingInvitation
  };
}
