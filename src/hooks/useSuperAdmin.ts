
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useSuperAdmin = () => {
  const { user, isAuthenticated } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [operatingMode, setOperatingMode] = useState<'superadmin' | 'normal'>('normal');

  useEffect(() => {
    const checkSuperAdminStatus = async () => {
      if (!user || !isAuthenticated) {
        setIsSuperAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_super_admin', {
          user_id: user.id
        });

        if (error) {
          console.error('Error checking super admin status:', error);
          setIsSuperAdmin(false);
        } else {
          setIsSuperAdmin(data || false);
          if (data) {
            // Initialize operating mode from localStorage or default to superadmin for superadmins
            const savedMode = localStorage.getItem('superadmin-operating-mode') as 'superadmin' | 'normal';
            setOperatingMode(savedMode || 'superadmin');
          } else {
            setOperatingMode('normal');
          }
        }
      } catch (error) {
        console.error('Error checking super admin status:', error);
        setIsSuperAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSuperAdminStatus();
  }, [user, isAuthenticated]);

  const switchOperatingMode = (mode: 'superadmin' | 'normal') => {
    setOperatingMode(mode);
    localStorage.setItem('superadmin-operating-mode', mode);
  };

  const isOperatingAsSuperAdmin = useMemo(() => {
    return isSuperAdmin && operatingMode === 'superadmin';
  }, [isSuperAdmin, operatingMode]);

  return { 
    isSuperAdmin, 
    isLoading, 
    operatingMode,
    isOperatingAsSuperAdmin,
    switchOperatingMode 
  };
};
