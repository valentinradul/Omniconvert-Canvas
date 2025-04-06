
import { toast } from 'sonner';

/**
 * Sends a team invitation email to the specified email address
 * This is a stub implementation - in a real application, you would
 * implement actual email sending functionality here
 */
export const sendTeamInvitationEmail = async (
  email: string, 
  name: string, 
  customMessage?: string
): Promise<boolean> => {
  try {
    console.log(`Sending invitation email to ${email} (${name})`);
    console.log('Custom message:', customMessage || '(none)');
    
    // In a real application, you would implement an API call to send emails here
    // For now, let's just log and assume success
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`Successfully sent invitation email to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    toast.error(`Failed to send invitation to ${email}`);
    throw error;
  }
};
