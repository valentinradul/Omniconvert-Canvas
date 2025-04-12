
import { GrowthIdea, Tag } from '@/types';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const getInitialData = <T extends unknown>(key: string, defaultValue: T): T => {
  const storedValue = localStorage.getItem(key);
  return storedValue ? JSON.parse(storedValue) : defaultValue;
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
