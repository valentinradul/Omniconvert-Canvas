import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { cleanupAuthState, deepCleanupAuthState } from '@/utils/authCleanup';

// Define the context type
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for existing session and set up auth listener
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', session?.user.id);
          
          // Check if user has pending invitations after sign in
          setTimeout(async () => {
            if (session?.user?.email) {
              try {
                const { data: invitations } = await supabase
                  .from('company_invitations')
                  .select('*')
                  .eq('email', session.user.email)
                  .eq('accepted', false);
                
                if (invitations && invitations.length > 0) {
                  console.log('User has pending invitations, staying on current page');
                } else {
                  // Check if user has company access
                  const { data: membership } = await supabase
                    .from('company_members')
                    .select('company_id')
                    .eq('user_id', session.user.id)
                    .limit(1);
                  
                  if (membership && membership.length > 0 && window.location.pathname === '/') {
                    // User has company access and is on home page, redirect to dashboard
                    window.location.href = '/dashboard';
                  }
                }
              } catch (error) {
                console.error('Error checking user invitations:', error);
              }
            }
          }, 1000);
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          // Clear any stored company data
          localStorage.removeItem('currentCompanyId');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Enhanced login function with better error handling and cleanup
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      console.log('Starting login process for:', email);
      
      // Enhanced cleanup before login attempt
      await deepCleanupAuthState();
      
      // Force sign out any existing session with retries
      let signOutAttempts = 0;
      while (signOutAttempts < 3) {
        try {
          console.log(`Sign out attempt ${signOutAttempts + 1}`);
          await supabase.auth.signOut({ scope: 'global' });
          break; // Success, exit loop
        } catch (signOutError) {
          console.log(`Sign out attempt ${signOutAttempts + 1} failed:`, signOutError);
          signOutAttempts++;
          if (signOutAttempts < 3) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      // Additional delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('Attempting sign in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });
      
      if (error) {
        console.error('Login error:', error);
        throw error;
      }
      
      console.log('Login successful:', data.user?.id);
    } catch (error: any) {
      console.error('Login failed:', error.message);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Please check your email and password';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please wait a moment and try again.';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (email: string, password: string, name: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        throw error;
      }

      toast({
        title: 'Account created',
        description: 'Please check your email to verify your account.',
      });
    } catch (error: any) {
      console.error('Signup failed:', error.message);
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: error.message || 'There was an error creating your account',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Starting logout process...');
      
      // Enhanced cleanup before logout
      await deepCleanupAuthState();
      
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Logout error:', error);
        // Don't throw on logout errors, still clean up
      }
      
      // Force clear state even if logout had errors
      setSession(null);
      setUser(null);
      
      toast({
        title: 'Logged out successfully',
        description: 'You have been logged out of your account',
      });
      
      // Force page reload to ensure clean state
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error: any) {
      console.error('Logout failed:', error.message);
      toast({
        variant: 'destructive',
        title: 'Logout failed',
        description: error.message || 'There was an error logging out',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
