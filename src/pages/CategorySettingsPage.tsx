import React from 'react';
import CategoryManagement from '@/components/categories/CategoryManagement';

const CategorySettingsPage: React.FC = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Category Settings</h1>
        <p className="text-muted-foreground">Manage growth idea categories for your company.</p>
      </div>
      
      <CategoryManagement />
    </div>
  );
};

export default CategorySettingsPage;