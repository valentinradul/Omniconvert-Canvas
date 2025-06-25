
import { GrowthIdea, Hypothesis, Experiment, Tag } from '@/types';

// Generate a proper UUID v4
export const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getInitialData = <T extends unknown>(key: string, defaultValue: T): T => {
  const storedValue = localStorage.getItem(key);
  return storedValue ? JSON.parse(storedValue) : defaultValue;
};

export const getAllTags = (ideas: GrowthIdea[]): Tag[] => {
  const tagSet = new Set<string>();
  
  ideas.forEach(idea => {
    if (idea.tags) {
      idea.tags.forEach(tag => tagSet.add(tag));
    }
  });
  
  return Array.from(tagSet);
};

export const getAllUserNames = (items: (GrowthIdea | Hypothesis | Experiment)[]): {id: string; name: string}[] => {
  const userMap = new Map<string, string>();
  
  items.forEach(item => {
    if (item.userId && item.userName) {
      userMap.set(item.userId, item.userName);
    }
  });
  
  return Array.from(userMap.entries()).map(([id, name]) => ({ id, name }));
};
