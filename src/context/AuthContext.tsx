import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

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
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Check for existing session and set up auth listener
  useEffect(() => {
    let isMounted = true;
    
    // FIRST: Check for existing session synchronously
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Initializing auth...');
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext: Error getting session:', error);
        }
        
        if (isMounted) {
          console.log('AuthContext: Initial session check:', existingSession?.user?.id || 'No session');
          setSession(existingSession);
          setUser(existingSession?.user ?? null);
          setIsInitialized(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('AuthContext: Failed to get session:', error);
        if (isMounted) {
          setIsInitialized(true);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    
    // THEN: Set up auth state listener for future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state change:', event, newSession?.user?.id);
        
        if (!isMounted) return;
        
        // Update state
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Ensure loading is false after any auth event
        if (isInitialized) {
          setIsLoading(false);
        }
        
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', newSession?.user?.id);
          
          // Check for user company access and redirect accordingly
          // Only redirect if we're on the login page or root page
          const currentPath = window.location.pathname;
          if (currentPath === '/' || currentPath === '/login') {
            setTimeout(async () => {
              if (newSession?.user?.id) {
                try {
                  // Check for pending invitations for regular users
                  const { data: invitations } = await supabase
                    .from('company_invitations')
                    .select('*')
                    .eq('email', newSession.user.email)
                    .eq('accepted', false);
                  
                  if (invitations && invitations.length > 0) {
                    console.log('User has pending invitations, staying on current page');
                  } else {
                    // Check if user has company access
                    const { data: membership } = await supabase
                      .from('company_members')
                      .select('company_id')
                      .eq('user_id', newSession.user.id)
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
        
        // Handle token refresh events - keep user logged in
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isInitialized]);

  // Simple login function - no aggressive cleanup that destroys sessions
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      console.log('Starting login process for:', email);
      
      // Normalize email and attempt sign in
      const normalizedEmail = email.trim().toLowerCase();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password.trim()
      });
      
      if (error) {
        console.error('Login error:', error.message);
        throw error;
      }
      
      if (!data.user) {
        throw new Error('Authentication failed - no user data');
      }
      
      console.log('Login successful for user:', data.user.id);
    } catch (error: any) {
      console.error('Login failed:', error);
      
      let errorMessage = 'Please check your email and password';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please wait a few minutes.';
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
      localStorage.removeItem('superadmin-operating-mode');
      
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
