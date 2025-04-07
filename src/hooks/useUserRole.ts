
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export const useUserRole = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(true); // Default to true as we're simplifying permissions
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [roles, setRoles] = useState<string[]>(['admin']); // Default admin role

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
