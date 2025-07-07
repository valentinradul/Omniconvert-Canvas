
import { CompanyRole } from './index';

// Extended company invitation type that includes department permissions
export interface ExtendedCompanyInvitation {
  id: string;
  company_id: string;
  email: string;
  role: string;
  invited_by: string;
  created_at: string;
  accepted: boolean | null;
  department_permissions?: {
    all: boolean;
    departmentIds?: string[];
  };
  companies?: {
    id: string;
    name: string;
  };
}

// Member department permissions type
export interface MemberDepartmentPermission {
  id: string;
  user_id: string;
  company_id: string;
  department_id: string | null;
  created_at: string;
}
