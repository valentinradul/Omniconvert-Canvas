
import { Tag } from './common';

// Category is now dynamic and fetched from database
export type Category = string;

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
  isArchived?: boolean;
};
