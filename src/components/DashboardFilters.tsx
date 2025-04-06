
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Category, ALL_CATEGORIES, Tag, Department, ALL_HYPOTHESIS_STATUSES } from '@/types';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DashboardFiltersProps {
  departments: Department[];
  allTags: Tag[];
  allUsers: { id: string; name: string }[];
  filters: {
    department?: string;
    category?: Category;
    status?: string;
    tag?: Tag;
    userId?: string;
    timeframe?: 'today' | 'week' | 'month' | 'quarter' | 'year';
  };
  onFilterChange: (filterName: string, value: string | undefined) => void;
  onClearFilters: () => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  departments,
  allTags,
  allUsers,
  filters,
  onFilterChange,
  onClearFilters
}) => {
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;
  
  return (
    <div>
      {/* Active filters display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center mb-4">
          <div className="text-sm font-medium mr-2">Active filters:</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null;
              
              let label = "";
              switch (key) {
                case 'department':
                  label = departments.find(d => d.id === value)?.name || 'Department';
                  break;
                case 'category':
                  label = value;
                  break;
                case 'status':
                  label = value;
                  break;
                case 'tag':
                  label = value;
                  break;
                case 'userId':
                  label = allUsers.find(u => u.id === value)?.name || 'User';
                  break;
                case 'timeframe':
                  label = value.charAt(0).toUpperCase() + value.slice(1);
                  break;
              }
              
              return (
                <Badge key={key} variant="secondary" className="flex items-center gap-1">
                  {label}
                  <X 
                    size={12} 
                    className="cursor-pointer" 
                    onClick={() => onFilterChange(key, undefined)}
                  />
                </Badge>
              );
            })}
          </div>
          <Button 
            variant="ghost" 
            onClick={onClearFilters} 
            size="sm" 
            className="h-7 text-xs ml-auto"
          >
            Clear all
          </Button>
        </div>
      )}
      
      {/* Horizontal filter controls */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        {/* Department filter */}
        <div>
          <Label htmlFor="department-filter" className="text-xs mb-1 block">Department</Label>
          <Select 
            value={filters.department} 
            onValueChange={(value) => onFilterChange('department', value)}
          >
            <SelectTrigger id="department-filter" className="h-9 text-sm">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Category filter */}
        <div>
          <Label htmlFor="category-filter" className="text-xs mb-1 block">Category</Label>
          <Select 
            value={filters.category} 
            onValueChange={(value) => onFilterChange('category', value as Category)}
          >
            <SelectTrigger id="category-filter" className="h-9 text-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {ALL_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Status filter */}
        <div>
          <Label htmlFor="status-filter" className="text-xs mb-1 block">Status</Label>
          <Select 
            value={filters.status} 
            onValueChange={(value) => onFilterChange('status', value)}
          >
            <SelectTrigger id="status-filter" className="h-9 text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {ALL_HYPOTHESIS_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Tag filter */}
        <div>
          <Label htmlFor="tag-filter" className="text-xs mb-1 block">Tag</Label>
          <Select 
            value={filters.tag} 
            onValueChange={(value) => onFilterChange('tag', value)}
          >
            <SelectTrigger id="tag-filter" className="h-9 text-sm">
              <SelectValue placeholder="All Tags" />
            </SelectTrigger>
            <SelectContent>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* User filter */}
        <div>
          <Label htmlFor="user-filter" className="text-xs mb-1 block">User</Label>
          <Select 
            value={filters.userId} 
            onValueChange={(value) => onFilterChange('userId', value)}
          >
            <SelectTrigger id="user-filter" className="h-9 text-sm">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              {allUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Timeframe filter */}
        <div>
          <Label htmlFor="timeframe-filter" className="text-xs mb-1 block">Timeframe</Label>
          <Select 
            value={filters.timeframe} 
            onValueChange={(value) => onFilterChange('timeframe', value as 'today' | 'week' | 'month' | 'quarter' | 'year')}
          >
            <SelectTrigger id="timeframe-filter" className="h-9 text-sm">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters;
