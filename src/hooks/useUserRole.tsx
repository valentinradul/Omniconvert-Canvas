
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type Role = 'admin' | 'manager' | 'member';

export function useUserRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRoles() {
      if (!user) {
        setRoles([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
          setRoles([]);
        } else {
          setRoles(data.map(item => item.role) as Role[]);
        }
      } catch (error) {
        console.error('Error in roles fetch:', error);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    }

    setIsLoading(true);
    fetchUserRoles();
  }, [user]);

  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager') || isAdmin;
  const isMember = roles.includes('member') || isManager;

  return { 
    roles,
    isAdmin,
    isManager, 
    isMember,
    isLoading
  };
}
