
export interface Company {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'member';
  created_at: string;
}

export interface CompanyInvitation {
  id: string;
  company_id: string;
  email: string;
  role: 'manager' | 'member';
  invited_by: string;
  created_at: string;
  accepted: boolean;
}
