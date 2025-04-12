
import { GrowthIdea, Tag } from '@/types';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const getInitialData = <T extends unknown>(key: string, defaultValue: T): T => {
  try {
    // First try user-specific key if provided
    if (key.includes('_')) {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        return JSON.parse(storedValue);
      }
    }
    
    // Then try the generic key (for backward compatibility)
    const genericKey = key.split('_')[0]; // Extract the base key without user ID
    if (genericKey) {
      const storedGenericValue = localStorage.getItem(genericKey);
      if (storedGenericValue) {
        console.log(`Found data in generic key: ${genericKey}`);
        return JSON.parse(storedGenericValue);
      }
    }
    
    // Return default if nothing found
    return defaultValue;
  } catch (error) {
    console.error(`Error retrieving data for key ${key}:`, error);
    return defaultValue;
  }
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
