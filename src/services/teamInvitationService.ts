
import { toast } from 'sonner';

/**
 * Sends an invitation email to a team member
 */
export const sendTeamInvitationEmail = async (email: string, name: string, customMessage?: string) => {
  // This would typically call a backend API to send an email
  // For now, we'll just simulate success
  console.log(`[MOCK] Sending invitation email to: ${email} for ${name}`);
  console.log(`[MOCK] Custom message: ${customMessage || 'No custom message'}`);
  
  // In a real implementation, you would call a backend API or use a service like SendGrid
  return true;
};
