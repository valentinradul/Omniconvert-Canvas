
import { GrowthIdea, Tag } from '@/types';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const getUserKey = (userId: string | undefined, key: string): string => {
  return userId ? `user_${userId}_${key}` : key;
};

export const getInitialData = <T extends unknown>(key: string, defaultValue: T, userId?: string): T => {
  if (!userId) return defaultValue;
  
  const userKey = getUserKey(userId, key);
  
  // First try to get user-specific data
  let storedValue = localStorage.getItem(userKey);
  
  // If no user-specific data exists and global data exists, migrate it
  if (!storedValue && localStorage.getItem(key)) {
    console.log(`Migrating global ${key} data to user-specific ${userKey}`);
    storedValue = localStorage.getItem(key);
    
    // Store the migrated data in the user-specific key
    if (storedValue) {
      localStorage.setItem(userKey, storedValue);
      
      // Don't remove global data here - that's handled in the migration process
    }
  }
  
  return storedValue ? JSON.parse(storedValue) : defaultValue;
};

export const saveData = <T extends unknown>(key: string, data: T, userId?: string): void => {
  if (!userId) return; // Don't save data if no user ID is provided
  
  const userKey = getUserKey(userId, key);
  localStorage.setItem(userKey, JSON.stringify(data));
};

export const getAllTags = (ideas: GrowthIdea[]): Tag[] => {
  const tagsSet = new Set<Tag>();
  
  ideas.forEach(idea => {
    if (idea.tags) {
      idea.tags.forEach(tag => tagsSet.add(tag));
    }
  });
  
  return Array.from(tagsSet);
};

export const getAllUserNames = (items: Array<{userId?: string; userName?: string}>) => {
  const usersMap = new Map<string, string>();
  
  items.forEach(item => {
    if (item.userId && item.userName) {
      usersMap.set(item.userId, item.userName);
    }
  });
  
  return Array.from(usersMap.entries()).map(([id, name]) => ({ id, name }));
};

// Function to create a default company if none exists
export const createDefaultCompany = async (supabase: any, userId: string, name: string = 'My Company') => {
  try {
    // Check if the user already has a company
    const { data: existingCompanies } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId);
      
    if (existingCompanies && existingCompanies.length > 0) {
      return null; // User already has at least one company
    }
    
    // Create new company
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({ 
        name, 
        created_by: userId 
      })
      .select()
      .single();
      
    if (companyError) throw companyError;
    
    // Add user as company owner
    const { error: memberError } = await supabase
      .from('company_members')
      .insert({
        company_id: companyData.id,
        user_id: userId,
        role: 'owner'
      });
      
    if (memberError) throw memberError;
    
    return companyData;
  } catch (error) {
    console.error('Error creating default company:', error);
    return null;
  }
};
