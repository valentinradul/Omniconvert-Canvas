
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

type Role = 'admin' | 'manager' | 'member';

interface UserRoleRecord {
  role: Role;
}

export function useUserRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  const fetchUserRoles = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      console.log(`Fetching roles for user ${user.id} (attempt ${retryCount + 1})`);
      
      const { data, error: supabaseError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id) as unknown as {
          data: UserRoleRecord[] | null;
          error: Error | null;
        };

      if (supabaseError) {
        throw supabaseError;
      } 
      
      if (data) {
        const userRoles = data.map(item => item.role as Role);
        console.log(`User ${user.id} roles:`, userRoles);
        setRoles(userRoles);
        setError(null);
        
        // Reset retry count on success
        setRetryCount(0);
      } else {
        console.log(`No roles found for user ${user.id}`);
        setRoles([]);
      }
    } catch (err) {
      console.error('Error fetching user roles:', err);
      
      setError(err instanceof Error ? err : new Error('Failed to fetch user roles'));
      
      // Only retry if we haven't exceeded max retries
      if (retryCount < MAX_RETRIES) {
        console.log(`Will retry role fetch in ${RETRY_DELAY}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, RETRY_DELAY);
      } else {
        // Show toast on final retry failure
        toast({
          title: "Permission Error",
          description: "Failed to fetch your permissions. Some features may be unavailable.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, retryCount]);

  useEffect(() => {
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;
    
    setIsLoading(true);
    
    fetchUserRoles();
    
    return () => {
      isMounted = false;
      clearTimeout(retryTimeout);
    };
  }, [user, fetchUserRoles]);

  // When retry count changes, useCallback will create a new fetchUserRoles function
  useEffect(() => {
    if (retryCount > 0) {
      fetchUserRoles();
    }
  }, [retryCount, fetchUserRoles]);

  // Debugging log to check what roles we have
  useEffect(() => {
    if (roles.length > 0) {
      console.log('Current user roles:', roles);
    }
  }, [roles]);

  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager') || isAdmin;
  const isMember = roles.includes('member') || isManager;

  return { 
    roles,
    isAdmin,
    isManager, 
    isMember,
    isLoading,
    error,
    refetch: fetchUserRoles
  };
}
