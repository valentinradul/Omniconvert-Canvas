
import { supabase } from '@/integrations/supabase/client';
import type { CompanyWithMembers, MemberWithProfile, DepartmentWithCompany } from '@/types/superAdmin';

export const superAdminService = {
  // Company management
  async getAllCompanies(): Promise<CompanyWithMembers[]> {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        created_at,
        created_by,
        company_members(count),
        departments(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(company => ({
      id: company.id,
      name: company.name,
      createdAt: company.created_at,
      createdBy: company.created_by,
      membersCount: company.company_members?.[0]?.count || 0,
      departmentsCount: company.departments?.[0]?.count || 0
    }));
  },

  async deleteCompany(companyId: string) {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (error) throw error;
  },

  // Member management
  async getAllMembers(): Promise<MemberWithProfile[]> {
    const { data, error } = await supabase
      .from('company_members')
      .select(`
        id,
        user_id,
        company_id,
        role,
        department_id,
        created_at,
        profiles!fk_company_members_user_id(full_name),
        departments(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(member => ({
      id: member.id,
      userId: member.user_id,
      companyId: member.company_id,
      role: member.role,
      departmentId: member.department_id,
      createdAt: member.created_at,
      profile: member.profiles ? {
        fullName: member.profiles.full_name
      } : null,
      department: member.departments ? {
        name: member.departments.name
      } : null
    }));
  },

  async removeMember(memberId: string) {
    const { error } = await supabase
      .from('company_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  },

  async updateMemberRole(memberId: string, role: string) {
    const { error } = await supabase
      .from('company_members')
      .update({ role })
      .eq('id', memberId);

    if (error) throw error;
  },

  // Department management
  async getAllDepartments(): Promise<DepartmentWithCompany[]> {
    const { data, error } = await supabase
      .from('departments')
      .select(`
        id,
        name,
        company_id,
        created_at,
        updated_at,
        created_by,
        companies(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(dept => ({
      id: dept.id,
      name: dept.name,
      companyId: dept.company_id,
      createdAt: dept.created_at,
      updatedAt: dept.updated_at,
      createdBy: dept.created_by,
      company: {
        name: dept.companies?.name || 'Unknown Company'
      }
    }));
  },

  async createDepartment(name: string, companyId: string, userId: string) {
    const { data, error } = await supabase
      .from('departments')
      .insert({
        name,
        company_id: companyId,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDepartment(departmentId: string) {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', departmentId);

    if (error) throw error;
  }
};
