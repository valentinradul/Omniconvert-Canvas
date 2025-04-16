
import { Tag } from './common';

export type Category = 
  | "Outreach" 
  | "Paid Ads" 
  | "Events" 
  | "Onboarding" 
  | "Product-led" 
  | "Content Marketing"
  | "SEO"
  | "Partnerships"
  | "Other";

export const ALL_CATEGORIES: Category[] = [
  "Outreach",
  "Paid Ads",
  "Events",
  "Onboarding",
  "Product-led",
  "Content Marketing",
  "SEO",
  "Partnerships",
  "Other"
];

export type GrowthIdea = {
  id: string;
  title: string;
  description: string;
  category: Category;
  departmentId: string;
  createdAt: Date;
  userId?: string;
  userName?: string;
  tags?: Tag[];
  companyId?: string;
  isPublic?: boolean;
};
