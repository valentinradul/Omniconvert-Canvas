
import { useState } from 'react';

export const usePostIdeaInvite = () => {
  const [showInvitePrompt, setShowInvitePrompt] = useState(false);
  const [ideaDetails, setIdeaDetails] = useState<{ id: string; title: string } | null>(null);
  
  const triggerInvitePrompt = (id: string, title: string) => {
    setIdeaDetails({ id, title });
    setShowInvitePrompt(true);
  };
  
  const closeInvitePrompt = () => {
    setShowInvitePrompt(false);
  };
  
  return {
    showInvitePrompt,
    ideaDetails,
    triggerInvitePrompt,
    closeInvitePrompt
  };
};
