
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Company, CompanyMember, CompanyRole, CompanyInvitation } from '@/types';

type CompanyContextType = {
  companies: Company[];
  currentCompany: Company | null;
  userCompanyRole: CompanyRole | null;
  companyMembers: CompanyMember[];
  companyInvitations: CompanyInvitation[];
  isLoading: boolean;
  createCompany: (name: string) => Promise<void>;
  switchCompany: (companyId: string) => void;
  inviteMember: (email: string, role: CompanyRole) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: CompanyRole) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [userCompanyRole, setUserCompanyRole] = useState<CompanyRole | null>(null);
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [companyInvitations, setCompanyInvitations] = useState<CompanyInvitation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load user's companies when authenticated
  useEffect(() => {
    if (user) {
      loadUserCompanies();
      loadUserInvitations();
    } else {
      setCompanies([]);
      setCurrentCompany(null);
      setUserCompanyRole(null);
      setCompanyMembers([]);
      setCompanyInvitations([]);
    }
  }, [user]);

  // Load company data when company is selected
  useEffect(() => {
    if (currentCompany) {
      loadCompanyMembers();
      loadUserRole();
      
      // Store current company ID in localStorage
      localStorage.setItem('currentCompanyId', currentCompany.id);
    }
  }, [currentCompany]);

  // Load company from local storage on init
  useEffect(() => {
    if (user && companies.length > 0) {
      const storedCompanyId = localStorage.getItem('currentCompanyId');
      if (storedCompanyId) {
        const company = companies.find(c => c.id === storedCompanyId);
        if (company) {
          setCurrentCompany(company);
        } else {
          setCurrentCompany(companies[0]);
        }
      } else {
        setCurrentCompany(companies[0]);
      }
    }
  }, [companies, user]);

  const loadUserCompanies = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id);
        
      if (memberError) throw memberError;
      
      if (memberData.length > 0) {
        const companyIds = memberData.map(m => m.company_id);
        
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds);
          
        if (companiesError) throw companiesError;
        
        // Convert to our application type
        const formattedCompanies: Company[] = companiesData.map(c => ({
          id: c.id,
          name: c.name,
          createdAt: new Date(c.created_at),
          createdBy: c.created_by
        }));
        
        setCompanies(formattedCompanies);
        
        if (formattedCompanies.length > 0 && !currentCompany) {
          setCurrentCompany(formattedCompanies[0]);
        }
      }
    } catch (error: any) {
      console.error('Error loading companies:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to load companies',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadUserInvitations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('email', user.email)
        .eq('accepted', false);
        
      if (error) throw error;
      
      const formattedInvitations: CompanyInvitation[] = data.map(i => ({
        id: i.id,
        companyId: i.company_id,
        email: i.email,
        role: i.role as CompanyRole,
        accepted: i.accepted,
        invitedBy: i.invited_by,
        createdAt: new Date(i.created_at)
      }));
      
      setCompanyInvitations(formattedInvitations);
    } catch (error: any) {
      console.error('Error loading invitations:', error.message);
    }
  };
  
  const loadUserRole = async () => {
    if (!user || !currentCompany) return;
    
    try {
      const { data, error } = await supabase
        .from('company_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', currentCompany.id)
        .single();
        
      if (error) throw error;
      
      setUserCompanyRole(data.role as CompanyRole);
    } catch (error: any) {
      console.error('Error loading user role:', error.message);
    }
  };
  
  const loadCompanyMembers = async () => {
    if (!currentCompany) return;
    
    try {
      const { data, error } = await supabase
        .from('company_members')
        .select('*')
        .eq('company_id', currentCompany.id);
        
      if (error) throw error;
      
      const formattedMembers: CompanyMember[] = data.map(m => ({
        id: m.id,
        companyId: m.company_id,
        userId: m.user_id,
        role: m.role as CompanyRole,
        createdAt: new Date(m.created_at)
      }));
      
      setCompanyMembers(formattedMembers);
    } catch (error: any) {
      console.error('Error loading company members:', error.message);
    }
  };
  
  const createCompany = async (name: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to create a company.',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create the company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({ 
          name, 
          created_by: user.id 
        })
        .select()
        .single();
      
      if (companyError) throw companyError;
      
      // Add user as company owner
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: companyData.id,
          user_id: user.id,
          role: 'owner'
        });
        
      if (memberError) throw memberError;
      
      const newCompany: Company = {
        id: companyData.id,
        name: companyData.name,
        createdAt: new Date(companyData.created_at),
        createdBy: companyData.created_by
      };
      
      setCompanies([...companies, newCompany]);
      setCurrentCompany(newCompany);
      setUserCompanyRole('owner');
      
      toast({
        title: 'Company created',
        description: `${name} has been created successfully.`,
      });
    } catch (error: any) {
      console.error('Error creating company:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to create company',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const switchCompany = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setCurrentCompany(company);
      localStorage.setItem('currentCompanyId', company.id);
    }
  };
  
  const inviteMember = async (email: string, role: CompanyRole) => {
    if (!user || !currentCompany) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must select a company first.',
      });
      return;
    }
    
    // Check user permission
    if (userCompanyRole !== 'owner' && userCompanyRole !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'Permission denied',
        description: 'Only owners and admins can invite new members.',
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('company_invitations')
        .insert({
          company_id: currentCompany.id,
          email,
          role,
          invited_by: user.id
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Add to local state
      const newInvitation: CompanyInvitation = {
        id: data.id,
        companyId: data.company_id,
        email: data.email,
        role: data.role as CompanyRole,
        accepted: false,
        invitedBy: data.invited_by,
        createdAt: new Date(data.created_at)
      };
      
      toast({
        title: 'Invitation sent',
        description: `An invitation has been sent to ${email}.`,
      });
      
    } catch (error: any) {
      console.error('Error inviting member:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to send invitation',
        description: error.message,
      });
    }
  };
  
  const removeMember = async (userId: string) => {
    if (!currentCompany || !userCompanyRole || (userCompanyRole !== 'owner' && userCompanyRole !== 'admin')) {
      toast({
        variant: 'destructive',
        title: 'Permission denied',
        description: 'You don\'t have permission to remove members.',
      });
      return;
    }
    
    // Check if trying to remove owner (not allowed)
    const memberToRemove = companyMembers.find(m => m.userId === userId);
    if (memberToRemove?.role === 'owner') {
      toast({
        variant: 'destructive',
        title: 'Action not allowed',
        description: 'You cannot remove the company owner.',
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('company_members')
        .delete()
        .eq('user_id', userId)
        .eq('company_id', currentCompany.id);
        
      if (error) throw error;
      
      // Update local state
      setCompanyMembers(companyMembers.filter(m => m.userId !== userId));
      
      toast({
        title: 'Member removed',
        description: 'The member has been removed from the company.',
      });
    } catch (error: any) {
      console.error('Error removing member:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to remove member',
        description: error.message,
      });
    }
  };
  
  const updateMemberRole = async (userId: string, role: CompanyRole) => {
    if (!currentCompany || !userCompanyRole || userCompanyRole !== 'owner') {
      toast({
        variant: 'destructive',
        title: 'Permission denied',
        description: 'Only the company owner can change member roles.',
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('company_members')
        .update({ role })
        .eq('user_id', userId)
        .eq('company_id', currentCompany.id);
        
      if (error) throw error;
      
      // Update local state
      setCompanyMembers(companyMembers.map(member => 
        member.userId === userId ? { ...member, role } : member
      ));
      
      toast({
        title: 'Role updated',
        description: 'The member\'s role has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating role:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to update role',
        description: error.message,
      });
    }
  };
  
  const acceptInvitation = async (invitationId: string) => {
    if (!user) return;
    
    const invitation = companyInvitations.find(i => i.id === invitationId);
    if (!invitation) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Invitation not found.',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Update invitation to accepted
      const { error: inviteError } = await supabase
        .from('company_invitations')
        .update({ accepted: true })
        .eq('id', invitationId);
        
      if (inviteError) throw inviteError;
      
      // Create company member entry
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: invitation.companyId,
          user_id: user.id,
          role: invitation.role
        });
        
      if (memberError) throw memberError;
      
      // Get company details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', invitation.companyId)
        .single();
        
      if (companyError) throw companyError;
      
      const company: Company = {
        id: companyData.id,
        name: companyData.name,
        createdAt: new Date(companyData.created_at),
        createdBy: companyData.created_by
      };
      
      // Update state
      setCompanies([...companies, company]);
      setCurrentCompany(company);
      setUserCompanyRole(invitation.role);
      setCompanyInvitations(companyInvitations.filter(i => i.id !== invitationId));
      
      toast({
        title: 'Invitation accepted',
        description: `You've successfully joined ${company.name}.`,
      });
      
      // Reload data
      loadUserCompanies();
      
    } catch (error: any) {
      console.error('Error accepting invitation:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to accept invitation',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const declineInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('company_invitations')
        .delete()
        .eq('id', invitationId);
        
      if (error) throw error;
      
      setCompanyInvitations(companyInvitations.filter(i => i.id !== invitationId));
      
      toast({
        title: 'Invitation declined',
        description: 'The invitation has been declined.',
      });
    } catch (error: any) {
      console.error('Error declining invitation:', error.message);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to decline invitation.',
      });
    }
  };
  
  return (
    <CompanyContext.Provider
      value={{
        companies,
        currentCompany,
        userCompanyRole,
        companyMembers,
        companyInvitations,
        isLoading,
        createCompany,
        switchCompany,
        inviteMember,
        removeMember,
        updateMemberRole,
        acceptInvitation,
        declineInvitation
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
