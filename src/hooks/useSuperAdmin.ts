
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSuperAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdminStatus = async () => {
      if (!user?.id) {
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
        }
      } catch (error) {
        console.error('Error checking super admin status:', error);
        setIsSuperAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSuperAdminStatus();
  }, [user?.id]);

  const grantSuperAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('super_admin_users')
        .insert({
          user_id: userId,
          granted_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Super admin granted",
        description: "User has been granted super admin privileges",
      });

      return true;
    } catch (error: any) {
      console.error('Error granting super admin:', error);
      toast({
        variant: "destructive",
        title: "Failed to grant super admin",
        description: error.message,
      });
      return false;
    }
  };

  const revokeSuperAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('super_admin_users')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Super admin revoked",
        description: "User's super admin privileges have been revoked",
      });

      return true;
    } catch (error: any) {
      console.error('Error revoking super admin:', error);
      toast({
        variant: "destructive",
        title: "Failed to revoke super admin",
        description: error.message,
      });
      return false;
    }
  };

  return {
    isSuperAdmin,
    isLoading,
    grantSuperAdmin,
    revokeSuperAdmin
  };
};
