import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Create a simple event emitter for mode changes
const modeChangeListeners = new Set<() => void>();

const notifyModeChange = () => {
  modeChangeListeners.forEach(listener => listener());
};

const addModeChangeListener = (listener: () => void) => {
  modeChangeListeners.add(listener);
  return () => {
    modeChangeListeners.delete(listener);
  };
};

export const useSuperAdmin = () => {
  const { user, isAuthenticated } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [operatingMode, setOperatingMode] = useState<'superadmin' | 'normal'>('normal');
  const [, forceRender] = useState({});

  // Add listener for mode changes from other components
  useEffect(() => {
    const unsubscribe = addModeChangeListener(() => {
      forceRender({});
    });
    return unsubscribe;
  }, []);

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
    // Notify all components using this hook that the mode has changed
    notifyModeChange();
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