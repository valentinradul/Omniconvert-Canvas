
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Department, Tag } from '@/types';
import { Building, Filter, TagIcon, User } from 'lucide-react';

interface HypothesisFiltersProps {
  departments: Department[];
  allTags: Tag[];
  allUsers: { id: string; name: string }[];
  searchQuery: string;
  filters: {
    departmentId?: string;
    tag?: Tag;
    minPectiScore?: number;
    userId?: string;
  };
  onSearchChange: (value: string) => void;
  onFilterChange: (filterName: keyof HypothesisFiltersProps['filters'], value: any) => void;
  onClearFilters: () => void;
}

const HypothesisFilters: React.FC<HypothesisFiltersProps> = ({
  departments,
  allTags,
  allUsers,
  searchQuery,
  filters,
  onSearchChange,
  onFilterChange,
  onClearFilters
}) => {
  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search hypotheses..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={onClearFilters} 
          disabled={Object.keys(filters).length === 0 && !searchQuery}
        >
          Clear Filters
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Building className="h-4 w-4 text-gray-500" />
            <Label>Department</Label>
          </div>
          <Select
            value={filters.departmentId || undefined}
            onValueChange={(value) => onFilterChange('departmentId', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <TagIcon className="h-4 w-4 text-gray-500" />
            <Label>Tag</Label>
          </div>
          <Select
            value={filters.tag || undefined}
            onValueChange={(value) => onFilterChange('tag', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Label>Min PECTI Score</Label>
          </div>
          <Select
            value={filters.minPectiScore?.toString() || undefined}
            onValueChange={(value) => onFilterChange('minPectiScore', value ? parseInt(value) : undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any score</SelectItem>
              <SelectItem value="30">30%+</SelectItem>
              <SelectItem value="50">50%+</SelectItem>
              <SelectItem value="70">70%+</SelectItem>
              <SelectItem value="80">80%+</SelectItem>
              <SelectItem value="90">90%+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <Label>User</Label>
          </div>
          <Select
            value={filters.userId || undefined}
            onValueChange={(value) => onFilterChange('userId', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {allUsers.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default HypothesisFilters;
