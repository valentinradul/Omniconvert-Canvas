import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { cleanupAuthState, deepCleanupAuthState, ultraCleanupAuthState } from '@/utils/authCleanup';

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
          
          // Check if user is super admin and redirect accordingly - only on fresh sign in
          // Only redirect if we're on the login page or root page
          const currentPath = window.location.pathname;
          if (currentPath === '/' || currentPath === '/login') {
            setTimeout(async () => {
              if (session?.user?.id) {
                try {
                  const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', {
                    user_id: session.user.id
                  });
                  
                  if (isSuperAdmin) {
                    console.log('Super admin detected, redirecting to super admin panel');
                    window.location.href = '/super-admin';
                    return;
                  }
                  
                  // Check for pending invitations for regular users
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
                    
                    if (membership && membership.length > 0) {
                      // User has company access, redirect to dashboard
                      window.location.href = '/dashboard';
                    }
                  }
                } catch (error) {
                  console.error('Error checking user status:', error);
                }
              }
            }, 500);
          }
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
      console.log('Starting enhanced login process for:', email);
      
      // Import ultra cleanup
      const { ultraCleanupAuthState } = await import('@/utils/authCleanup');
      
      // Ultra cleanup before login attempt
      await ultraCleanupAuthState();
      
      // Force sign out any existing session with more retries
      let signOutAttempts = 0;
      while (signOutAttempts < 5) {
        try {
          console.log(`Sign out attempt ${signOutAttempts + 1}`);
          await supabase.auth.signOut({ scope: 'global' });
          break; // Success, exit loop
        } catch (signOutError) {
          console.log(`Sign out attempt ${signOutAttempts + 1} failed:`, signOutError);
          signOutAttempts++;
          if (signOutAttempts < 5) {
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, signOutAttempts) * 200));
          }
        }
      }
      
      // Additional delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Attempting sign in with cleaned state...');
      
      // Normalize email and attempt sign in
      const normalizedEmail = email.trim().toLowerCase();
      console.log('Normalized email:', normalizedEmail);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password.trim()
      });
      
      if (error) {
        console.error('Login error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        throw error;
      }
      
      if (!data.user) {
        console.error('Login succeeded but no user data returned');
        throw new Error('Authentication failed - no user data');
      }
      
      console.log('Login successful for user:', data.user.id);
    } catch (error: any) {
      console.error('Login failed with error:', error);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Please check your email and password';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please double-check your credentials and try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please wait a few minutes and try again.';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('User not found')) {
        errorMessage = 'No account found with this email address. Please check your email or sign up.';
      } else if (error.status === 400) {
        errorMessage = 'Invalid login credentials. Please verify your email and password.';
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

  // Bulletproof logout function that ignores all server errors
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    console.log('Starting bulletproof logout process...');
    
    // Step 1: Immediately clear local state (don't wait for server)
    setSession(null);
    setUser(null);
    
    // Step 2: Clear all local storage
    try {
      localStorage.removeItem('currentCompanyId');
      localStorage.removeItem('userCompanies');
      
      // Clear all Supabase auth keys
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (storageError) {
      console.log('Storage cleanup had minor issues:', storageError);
    }
    
    // Step 3: Attempt server logout but completely ignore any errors
    try {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('Server logout completed successfully');
    } catch (serverError: any) {
      console.log('Server logout failed, but continuing (this is expected):', serverError.message);
      // Completely ignore server errors - we've already cleared local state
    }
    
    // Step 4: Always show success (since local state is cleared)
    toast({
      title: 'Logged out successfully',
      description: 'You have been logged out',
    });
    
    setIsLoading(false);
    
    // Step 5: Force clean page reload
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
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
