
import { supabase } from '@/integrations/supabase/client';
import { GrowthIdea, Tag } from '@/types';

// Define a type for the database response structure
type IdeaDatabaseRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  departmentid: string;
  createdat: string;
  user_id: string;
  username: string;
  tags: string[];
  company_id: string;
  responsibleuserid: string;
  is_public: boolean;
};

export interface NewIdea {
  title: string;
  description: string;
  category: string;
  departmentId?: string;
  tags?: Tag[];
  userId?: string;
  userName?: string;
  companyId?: string;
  isPublic?: boolean;
}

export const fetchIdeas = async (companyId?: string) => {
  try {
    let query = supabase.from('ideas').select();
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transform database fields to match frontend model
    const formattedIdeas: GrowthIdea[] = (data || []).map((idea: IdeaDatabaseRecord) => ({
      id: idea.id,
      title: idea.title,
      description: idea.description || "",
      category: idea.category as any,
      departmentId: idea.departmentid,
      createdAt: new Date(idea.createdat),
      userId: idea.user_id,
      userName: idea.username,
      tags: idea.tags || [],
      companyId: idea.company_id,
      isPublic: idea.is_public
    }));
    
    return formattedIdeas;
  } catch (error: any) {
    console.error('Error fetching ideas:', error.message);
    throw error;
  }
};

export const createIdea = async (idea: NewIdea): Promise<GrowthIdea | null> => {
  try {
    // Map frontend properties to database column names
    const newIdea = {
      title: idea.title,
      description: idea.description,
      category: idea.category,
      departmentid: idea.departmentId,
      tags: idea.tags || [],
      user_id: idea.userId,
      username: idea.userName,
      company_id: idea.companyId,
      is_public: idea.isPublic || false
    };
    
    // Fix: Remove any department ID if it's not a valid UUID
    if (newIdea.departmentid && typeof newIdea.departmentid === 'string') {
      // Validate UUID format - basic validation check
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(newIdea.departmentid)) {
        delete newIdea.departmentid;
      }
    }
    
    const { data, error } = await supabase
      .from('ideas')
      .insert(newIdea)
      .select()
      .single();
    
    if (error) throw error;
    
    // Transform the returned data to match our frontend model
    const formattedIdea: GrowthIdea = {
      id: data.id,
      title: data.title,
      description: data.description || "",
      category: data.category as any,
      departmentId: data.departmentid,
      createdAt: new Date(data.createdat),
      userId: data.user_id,
      userName: data.username,
      tags: data.tags || [],
      companyId: data.company_id,
      isPublic: data.is_public
    };
    
    return formattedIdea;
  } catch (error: any) {
    console.error('Error adding idea:', error.message);
    throw error;
  }
};

export const updateIdea = async (id: string, ideaUpdates: Partial<GrowthIdea>) => {
  try {
    // Map frontend properties to database column names
    const updates: Record<string, any> = {};
    
    if ('title' in ideaUpdates) updates.title = ideaUpdates.title;
    if ('description' in ideaUpdates) updates.description = ideaUpdates.description;
    if ('category' in ideaUpdates) updates.category = ideaUpdates.category;
    if ('departmentId' in ideaUpdates) updates.departmentid = ideaUpdates.departmentId;
    if ('tags' in ideaUpdates) updates.tags = ideaUpdates.tags;
    if ('isPublic' in ideaUpdates) updates.is_public = ideaUpdates.isPublic;
    
    // Use simple select() with no table references to avoid ambiguity
    const { data, error } = await supabase
      .from('ideas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error: any) {
    console.error('Error updating idea:', error.message);
    throw error;
  }
};

export const fetchPublicIdeas = async () => {
  try {
    const { data, error } = await supabase
      .from('ideas')
      .select()
      .eq('is_public', true);
    
    if (error) throw error;
    
    // Transform database fields to match frontend model
    const formattedIdeas: GrowthIdea[] = (data || []).map((idea: IdeaDatabaseRecord) => ({
      id: idea.id,
      title: idea.title,
      description: idea.description || "",
      category: idea.category as any,
      departmentId: idea.departmentid,
      createdAt: new Date(idea.createdat),
      userId: idea.user_id,
      userName: idea.username,
      tags: idea.tags || [],
      companyId: idea.company_id,
      isPublic: true
    }));
    
    return formattedIdeas;
  } catch (error: any) {
    console.error('Error fetching public ideas:', error.message);
    throw error;
  }
};

export const deleteIdeaById = async (id: string) => {
  try {
    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error: any) {
    console.error('Error deleting idea:', error.message);
    throw error;
  }
};
