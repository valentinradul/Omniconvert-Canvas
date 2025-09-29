import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Company, CompanyMember, CompanyRole, CompanyInvitation } from '@/types';
import { useCompanyData } from './hooks/useCompanyData';
import { useCompanyActions } from './hooks/useCompanyActions';
import { supabase } from '@/integrations/supabase/client';

type CompanyContextType = {
  companies: Company[];
  currentCompany: Company | null;
  userCompanyRole: CompanyRole | null;
  companyMembers: CompanyMember[];
  companyInvitations: CompanyInvitation[];
  userIncomingInvitations: CompanyInvitation[];
  pendingInvitations: CompanyInvitation[];
  contentSettings: { restrict_content_to_departments: boolean } | null;
  isLoading: boolean;
  createCompany: (name: string) => Promise<void>;
  switchCompany: (companyId: string) => void;
  inviteMember: (email: string, role: CompanyRole, departmentPermissions?: string[]) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: CompanyRole) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  unsendInvitation: (invitationId: string) => Promise<void>;
  refreshPendingInvitations: () => Promise<void>;
  refreshCompanyMembers: () => Promise<void>;
  refreshUserCompanies: () => Promise<void>;
  refreshUserIncomingInvitations: () => Promise<void>;
  updateContentSettings: (settings: { restrict_content_to_departments: boolean }) => Promise<void>;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [contentSettings, setContentSettings] = useState<{ restrict_content_to_departments: boolean } | null>(null);
  
  const companyData = useCompanyData(user?.id);
  const {
    companies,
    setCompanies,
    currentCompany,
    setCurrentCompany,
    userCompanyRole,
    setUserCompanyRole,
    companyMembers,
    setCompanyMembers,
    companyInvitations,
    setCompanyInvitations,
    userIncomingInvitations,
    setUserIncomingInvitations,
    pendingInvitations,
    setPendingInvitations,
    isLoading,
    fetchUserCompanies,
    fetchUserInvitations,
    fetchUserIncomingInvitations,
    fetchUserRole,
    fetchCompanyMembers,
    fetchPendingInvitations,
    switchCompany
  } = companyData;
  
  useEffect(() => {
    const fetchContentSettings = async () => {
      if (!currentCompany?.id) {
        setContentSettings(null);
        return;
      }

      try {
        console.log('🔧 Fetching content settings for company:', currentCompany.id);
        
        const { data, error } = await supabase
          .from('company_content_settings')
          .select('restrict_content_to_departments')
          .eq('company_id', currentCompany.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching content settings:', error);
          // Default to not restricting content if there's an error
          setContentSettings({ restrict_content_to_departments: false });
          return;
        }

        console.log('📋 Content settings data:', data);

        // If no settings exist, create default settings
        if (!data) {
          console.log('⚙️ No content settings found, creating defaults');
          
          const { data: newSettings, error: insertError } = await supabase
            .from('company_content_settings')
            .insert({
              company_id: currentCompany.id,
              restrict_content_to_departments: false
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating default content settings:', insertError);
            setContentSettings({ restrict_content_to_departments: false });
          } else {
            setContentSettings({ restrict_content_to_departments: newSettings.restrict_content_to_departments });
          }
        } else {
          setContentSettings({ restrict_content_to_departments: data.restrict_content_to_departments });
        }
        
        console.log('✅ Final content settings:', contentSettings);
      } catch (error) {
        console.error('Error fetching content settings:', error);
        setContentSettings({ restrict_content_to_departments: false });
      }
    };

    fetchContentSettings();
  }, [currentCompany?.id]);

  const updateContentSettings = async (settings: { restrict_content_to_departments: boolean }) => {
    if (!currentCompany?.id) return;

    try {
      console.log('🔄 Updating content settings for company:', currentCompany.id, 'with:', settings);
      
      const { data, error } = await supabase
        .from('company_content_settings')
        .upsert({
          company_id: currentCompany.id,
          restrict_content_to_departments: settings.restrict_content_to_departments
        }, {
          onConflict: 'company_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating content settings:', error);
        throw error;
      }

      setContentSettings(settings);
      console.log('✅ Content settings updated successfully:', settings);
    } catch (error) {
      console.error('Error updating content settings:', error);
      throw error;
    }
  };
  
  const {
    createCompany,
    inviteMember,
    removeMember,
    updateMemberRole,
    acceptInvitation: baseAcceptInvitation,
    declineInvitation,
    unsendInvitation: apiUnsendInvitation
  } = useCompanyActions(
    user?.id,
    userCompanyRole,
    currentCompany?.id || null,
    companyMembers,
    companyInvitations,
    setCompanies,
    setCurrentCompany,
    setUserCompanyRole,
    setCompanyMembers,
    setCompanyInvitations,
    fetchUserCompanies
  );

  const acceptInvitation = async (invitationId: string) => {
    console.log('🚀 CompanyContext: MANUAL invitation acceptance triggered by user click');
    
    try {
      const result = await baseAcceptInvitation(invitationId);
      
      if (result && result.company && result.role) {
        console.log('🔄 CompanyContext: Manual invitation accepted, performing comprehensive refresh');
        
        // Clear localStorage to force fresh data
        localStorage.removeItem('userCompanies');
        localStorage.removeItem('currentCompanyId');
        
        // Get the new company details
        const newCompany = result.company;
        const newRole = result.role as CompanyRole;
        
        console.log('🎯 CompanyContext: New company joined via MANUAL acceptance:', newCompany.name, 'Role:', newRole);
        
        // Add the new company to the companies list
        setCompanies(prevCompanies => {
          const exists = prevCompanies.find(c => c.id === newCompany.id);
          if (!exists) {
            return [...prevCompanies, newCompany];
          }
          return prevCompanies;
        });
        
        // Immediately switch to the new company
        setCurrentCompany(newCompany);
        setUserCompanyRole(newRole);
        localStorage.setItem('currentCompanyId', newCompany.id);
        
        // Refresh user incoming invitations to remove the accepted one
        if (user?.email) {
          await fetchUserIncomingInvitations(user.email);
        }
        
        // Refresh all company-related data for the new company
        await fetchUserCompanies();
        
        // Small delay to ensure database changes are committed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force refresh of company-specific data
        await fetchCompanyMembers();
        await fetchUserRole();
        await fetchPendingInvitations();
        
        console.log('✅ CompanyContext: Successfully processed MANUAL invitation acceptance');
      }
    } catch (error) {
      console.error('❌ CompanyContext: Error in MANUAL acceptInvitation:', error);
      throw error;
    }
  };

  const refreshPendingInvitations = async () => {
    await fetchPendingInvitations();
    // Also refresh company members in case someone accepted an invitation
    await fetchCompanyMembers();
  };

  const refreshCompanyMembers = async () => {
    await fetchCompanyMembers();
  };

  const refreshUserCompanies = async () => {
    console.log('🔄 CompanyContext: Manually refreshing user companies');
    await fetchUserCompanies();
  };

  const refreshUserIncomingInvitations = async () => {
    if (user?.email) {
      console.log('🔄 CompanyContext: Manually refreshing user incoming invitations');
      await fetchUserIncomingInvitations(user.email);
    }
  };

  const unsendInvitation = async (invitationId: string) => {
    await apiUnsendInvitation(invitationId, setPendingInvitations);
    await refreshPendingInvitations();
  };

  useEffect(() => {
    console.log('🔄 CompanyContext: User or auth state changed', { 
      userId: user?.id,
      userEmail: user?.email,
      isAuthenticated: !!user
    });
    
    if (user) {
      // Only clear userCompanies cache, NOT currentCompanyId on refresh
      const cachedCompanies = localStorage.getItem('userCompanies');
      if (!cachedCompanies) {
        localStorage.removeItem('userCompanies');
      }
      
      console.log('📊 CompanyContext: Fetching companies for authenticated user');
      // Add delay to ensure auth state is fully settled
      setTimeout(() => {
        fetchUserCompanies();
        if (user.email) {
          console.log('📧 CompanyContext: Fetching incoming invitations for email:', user.email);
          fetchUserIncomingInvitations(user.email);
        }
      }, 100);
    } else {
      // Clear all state when user logs out
      setCompanies([]);
      setCurrentCompany(null);
      setUserCompanyRole(null);
      setCompanyMembers([]);
      setCompanyInvitations([]);
      setUserIncomingInvitations([]);
      setPendingInvitations([]);
      setContentSettings(null);
      
      // Clear localStorage when user logs out
      localStorage.removeItem('currentCompanyId');
      localStorage.removeItem('userCompanies');
    }
  }, [user]);

  useEffect(() => {
    if (currentCompany) {
      console.log('🏢 CompanyContext: Current company changed:', currentCompany.name, 'ID:', currentCompany.id);
      fetchCompanyMembers();
      fetchUserRole();
      fetchPendingInvitations();
      
      localStorage.setItem('currentCompanyId', currentCompany.id);
    }
  }, [currentCompany]);

  useEffect(() => {
    if (user && companies.length > 0) {
      // Only set initial company if we don't have one yet
      if (!currentCompany) {
        const storedCompanyId = localStorage.getItem('currentCompanyId');
        console.log('🎯 CompanyContext: Setting current company', { 
          companiesCount: companies.length,
          storedCompanyId,
          availableCompanies: companies.map(c => ({ id: c.id, name: c.name }))
        });
        
        if (storedCompanyId) {
          const company = companies.find(c => c.id === storedCompanyId);
          if (company) {
            console.log('✅ CompanyContext: Setting stored company as current:', company.name);
            setCurrentCompany(company);
            return;
          }
        }
        
        console.log('📌 CompanyContext: No valid stored company, setting first available');
        setCurrentCompany(companies[0]);
      }
    }
  }, [companies, user]);
  
  return (
    <CompanyContext.Provider
      value={{
        companies,
        currentCompany,
        userCompanyRole,
        companyMembers,
        companyInvitations,
        userIncomingInvitations,
        pendingInvitations,
        contentSettings,
        isLoading,
        createCompany,
        switchCompany,
        inviteMember,
        removeMember,
        updateMemberRole,
        acceptInvitation,
        declineInvitation,
        unsendInvitation,
        refreshPendingInvitations,
        refreshCompanyMembers,
        refreshUserCompanies,
        refreshUserIncomingInvitations,
        updateContentSettings
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
