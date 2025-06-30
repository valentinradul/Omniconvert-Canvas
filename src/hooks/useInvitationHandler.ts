
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
        console.log('Invitation company ID:', invitation.company_id);
        console.log('User email from auth:', user.email);
        console.log('Invitation email:', invitation.email);

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

        // Check if user is already a member of this company with the EXACT same company ID
        const { data: existingMember, error: memberCheckError } = await supabase
          .from('company_members')
          .select('id, role, company_id')
          .eq('user_id', user.id)
          .eq('company_id', invitation.company_id) // Ensure exact company ID match
          .maybeSingle();

        if (memberCheckError) {
          console.error('Error checking existing membership:', memberCheckError);
          throw new Error('Unable to verify membership status');
        }

        console.log('Existing member check:', existingMember);
        console.log('Expected company ID:', invitation.company_id);

        if (existingMember) {
          console.log('User is already a member of this company with matching company ID:', existingMember.company_id);
          
          // Verify the company IDs match exactly
          if (existingMember.company_id !== invitation.company_id) {
            console.error('Company ID mismatch in existing membership:', {
              existingCompanyId: existingMember.company_id,
              invitationCompanyId: invitation.company_id
            });
            toast({
              variant: "destructive",
              title: "Company mismatch",
              description: "There's a mismatch in company information. Please contact support.",
            });
            return;
          }
          
          // Mark invitation as accepted since user is already a member with correct company ID
          await supabase
            .from('company_invitations')
            .update({ accepted: true })
            .eq('id', invitationId);
            
          toast({
            title: "Welcome back!",
            description: `You're already a member of ${(invitation.companies as any)?.name || 'this company'}`,
          });
          
          // Refresh companies to ensure we have the latest data
          await refreshUserCompanies();
          
          // Switch to this company using the exact company ID from invitation
          switchCompany(invitation.company_id);
          
          // Clear URL parameters and redirect
          setTimeout(() => {
            window.history.replaceState({}, '', '/dashboard');
            navigate('/dashboard', { replace: true });
          }, 500);
          return;
        }

        // If invitation is not yet accepted, accept it with exact company ID matching
        if (!invitation.accepted) {
          console.log('Accepting invitation with company ID:', invitation.company_id);

          // Accept the invitation (this should create company membership with exact company ID)
          const result = await acceptInvitation(invitationId, user.id, [invitation]);
          
          if (result) {
            console.log('Invitation accepted successfully');
            
            // Verify the company membership was created with the correct company ID
            const { data: newMember, error: verifyError } = await supabase
              .from('company_members')
              .select('company_id, role')
              .eq('user_id', user.id)
              .eq('company_id', invitation.company_id)
              .single();
              
            if (verifyError || !newMember) {
              console.error('Failed to verify new membership with correct company ID:', verifyError);
              toast({
                variant: "destructive",
                title: "Membership verification failed",
                description: "Unable to verify your company membership. Please try again.",
              });
              return;
            }
            
            console.log('Verified new membership with correct company ID:', newMember.company_id);
            setHasProcessedInvitation(true);
            
            toast({
              title: "Welcome to the team!",
              description: `You've successfully joined ${(invitation.companies as any)?.name || 'the company'}`,
            });
          }
        }

        // Refresh companies to get the updated list
        console.log('Refreshing user companies...');
        await refreshUserCompanies();
        
        // Wait a bit to ensure companies are loaded
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Switch to the company using exact company ID from invitation
        console.log('Switching to company with ID:', invitation.company_id);
        switchCompany(invitation.company_id);
        
        // Clear URL parameters and redirect
        setTimeout(() => {
          window.history.replaceState({}, '', '/dashboard');
          navigate('/dashboard', { replace: true });
        }, 500);
        
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
