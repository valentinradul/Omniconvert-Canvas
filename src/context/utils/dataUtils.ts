
import { GrowthIdea, Tag } from '@/types';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const getInitialData = <T extends unknown>(key: string, defaultValue: T): T => {
  try {
    // First check for user-specific key
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      console.log(`Found data in user-specific key: ${key}`);
      return JSON.parse(storedValue);
    }
    
    // Check for legacy keys (without user id)
    const legacyKey = key.split('_')[0]; // Remove user ID part if present
    if (legacyKey && legacyKey !== key) {
      const legacyValue = localStorage.getItem(legacyKey);
      if (legacyValue) {
        console.log(`Found data in legacy key: ${legacyKey}, will migrate to: ${key}`);
        const parsedValue = JSON.parse(legacyValue);
        // Save to the new key format to migrate data
        localStorage.setItem(key, legacyValue);
        return parsedValue;
      }
    }
    
    // Finally check for generic key (no user id, old format)
    if (key.includes('_')) {
      const genericKey = key.split('_')[0];
      const genericValue = localStorage.getItem(genericKey);
      if (genericValue) {
        console.log(`Found data in generic key: ${genericKey}`);
        return JSON.parse(genericValue);
      }
    }
    
    console.log(`No data found for ${key}, using default value`);
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

// Function to merge data from multiple keys
export const mergeDataFromAllSources = <T extends {id: string}>(keys: string[], defaultValue: T[]): T[] => {
  const allItems = new Map<string, T>();
  
  // Try all possible keys
  keys.forEach(key => {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        const items = JSON.parse(storedValue) as T[];
        items.forEach(item => {
          // Only add if not already in the map (prioritize first found)
          if (!allItems.has(item.id)) {
            allItems.set(item.id, item);
          }
        });
      }
    } catch (error) {
      console.error(`Error retrieving data for key ${key}:`, error);
    }
  });
  
  const result = Array.from(allItems.values());
  console.log(`Merged data from multiple sources: ${result.length} items found`);
  return result.length > 0 ? result : defaultValue;
};
