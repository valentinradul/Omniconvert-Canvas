
// Common shared types used across multiple domain entities

export type Tag = string;

export type Department = {
  id: string;
  name: string;
};

// Define the CompanyRole type
export type CompanyRole = 'owner' | 'admin' | 'member';

// Company-related types
export type Company = {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
};

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyRole;
  createdAt: Date;
  profile?: {
    fullName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface CompanyInvitation {
  id: string;
  companyId: string;
  email: string;
  role: CompanyRole;
  accepted: boolean;
  invitedBy: string;
  createdAt: Date;
}

// Extended type for observation content that supports text, URLs, and images
export type ObservationContent = {
  text: string;
  imageUrls?: string[];
  externalUrls?: string[];
};
