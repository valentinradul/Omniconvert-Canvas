
import { useState, useEffect } from 'react';
import { Category } from '@/types';
import { getInitialData } from './utils';

export const useCategories = (ideas: any[]) => {
  const [categories, setCategories] = useState<Category[]>(() =>
    getInitialData('categories', [
      "Outreach", 
      "Paid Ads", 
      "Events", 
      "Onboarding", 
      "Product-led", 
      "Content Marketing",
      "SEO",
      "Partnerships",
      "Other"
    ])
  );

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  const addCategory = (category: Category) => {
    setCategories([...categories, category]);
  };
  
  const editCategory = (oldCategory: Category, newCategory: Category) => {
    // Update the categories list
    setCategories(categories.map(cat => cat === oldCategory ? newCategory : cat));
  };
  
  const deleteCategory = (category: Category) => {
    // Check if any ideas are using this category
    const ideasUsingCategory = ideas.some(idea => idea.category === category);
    
    if (ideasUsingCategory) {
      alert('Cannot delete category that has ideas associated with it.');
      return;
    }
    
    setCategories(categories.filter(cat => cat !== category));
  };

  return {
    categories,
    addCategory,
    editCategory,
    deleteCategory
  };
};
