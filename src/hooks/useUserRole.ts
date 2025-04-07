
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export const useUserRole = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(true); // Everyone is admin in simplified version
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [roles, setRoles] = useState<string[]>(['user']); // Default user role

  const refetch = () => {
    // This function would normally refetch roles, but we've simplified it
    setIsAdmin(true);
  };

  return {
    isAdmin,
    isLoading,
    roles,
    error,
    refetch
  };
};
