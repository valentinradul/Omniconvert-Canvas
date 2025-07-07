
export interface SuperAdminUser {
  id: string;
  userId: string;
  grantedBy: string | null;
  grantedAt: string;
  isActive: boolean;
}

export interface CompanyWithMembers {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  membersCount: number;
  departmentsCount: number;
}

export interface MemberWithProfile {
  id: string;
  userId: string;
  companyId: string;
  role: string;
  departmentId: string | null;
  createdAt: string;
  profile: {
    fullName: string | null;
  } | null;
  department: {
    name: string;
  } | null;
}

export interface DepartmentWithCompany {
  id: string;
  name: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  company: {
    name: string;
  };
}
