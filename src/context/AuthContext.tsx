
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast as sonnerToast } from 'sonner';

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
    console.log('AuthProvider: Initializing auth state');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log(`Auth state changed: ${event}`, currentSession?.user?.id);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          // Defer profile fetch to avoid Supabase authentication deadlock
          setTimeout(() => {
            console.log('User signed in:', currentSession?.user.id);
            
            // Try to recover any orphaned data
            if (currentSession?.user) {
              const oldIdeasStr = localStorage.getItem('ideas');
              if (oldIdeasStr) {
                const userId = currentSession.user.id;
                const userSpecificKey = `ideas_${userId}`;
                
                // Only migrate if user-specific data doesn't exist yet
                if (!localStorage.getItem(userSpecificKey)) {
                  console.log('Migrating orphaned ideas to user account');
                  localStorage.setItem(userSpecificKey, oldIdeasStr);
                  
                  // Do the same for hypotheses and experiments
                  ['hypotheses', 'experiments'].forEach(dataType => {
                    const oldDataStr = localStorage.getItem(dataType);
                    if (oldDataStr) {
                      localStorage.setItem(`${dataType}_${userId}`, oldDataStr);
                    }
                  });
                  
                  sonnerToast.success('Recovered your previous data!');
                }
              }
            }
          }, 0);
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log('Retrieved initial session:', initialSession?.user?.id);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      console.log('Attempting login for:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Login failed:', error.message);
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message || 'Please check your email and password',
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
          }
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

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Logged out successfully',
        description: 'You have been logged out of your account',
      });
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
