
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { deepCleanupAuthState } from "@/utils/authCleanup";

export const useGoogleLogin = () => {
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    try {
      // Enhanced cleanup before Google login
      await deepCleanupAuthState();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        if (error.message.includes('provider is not enabled')) {
          toast({
            variant: "destructive",
            title: "Google login is not enabled",
            description: "The administrator needs to configure Google authentication in Supabase.",
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login with Google failed",
        description: error.message || "Please try again later",
      });
    }
  };

  return { handleGoogleLogin };
};
