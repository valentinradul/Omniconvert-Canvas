import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Company } from '@/types';
import { useCompany } from './company/CompanyContext';

interface Department {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
}

interface AppContextType {
  departments: Department[];
  fetchDepartments: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const { currentCompany, userCompanyRole } = useCompany();
  const { user } = useAuth();

  const fetchDepartments = useCallback(async () => {
    if (!currentCompany) {
      setDepartments([]);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // If user is owner or admin, show all departments
      if (userCompanyRole === 'owner' || userCompanyRole === 'admin') {
        const { data, error } = await supabase
          .from('departments')
          .select('*')
          .eq('company_id', currentCompany.id)
          .order('name');

        if (error) throw error;
        setDepartments(data || []);
      } else {
        // For regular members, only show departments they have access to
        const { data, error } = await supabase
          .from('departments')
          .select(`
            *,
            member_department_permissions!inner (
              member_id,
              company_members!inner (
                user_id
              )
            )
          `)
          .eq('company_id', currentCompany.id)
          .eq('member_department_permissions.company_members.user_id', user.id)
          .order('name');

        if (error) throw error;
        setDepartments(data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, [currentCompany, userCompanyRole, user]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments, currentCompany]);

  return (
    <AppContext.Provider
      value={{
        departments,
        fetchDepartments
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within a AppProvider');
  }
  return context;
};
