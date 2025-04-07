
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface IdeaFiltersProps {
  allTags: string[];
  allUsers: Array<{ id: string; name: string }>;
  filterTag?: string;
  filterUserId?: string;
  setFilterTag: (tag?: string) => void;
  setFilterUserId: (userId?: string) => void;
}

const IdeaFilters: React.FC<IdeaFiltersProps> = ({
  allTags,
  allUsers,
  filterTag,
  filterUserId,
  setFilterTag,
  setFilterUserId
}) => {
  const handleClearFilters = () => {
    setFilterTag(undefined);
    setFilterUserId(undefined);
  };

  const hasActiveFilters = filterTag || filterUserId;

  return (
    <div className="flex gap-4 mb-6">
      <div className="w-64">
        <Label htmlFor="filter-tag" className="mb-1 block">Filter by Tag</Label>
        <Select
          value={filterTag}
          onValueChange={(value) => setFilterTag(value === 'all' ? undefined : value)}
        >
          <SelectTrigger id="filter-tag">
            <SelectValue placeholder="All Tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {allTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-64">
        <Label htmlFor="filter-user" className="mb-1 block">Filter by Responsible</Label>
        <Select
          value={filterUserId}
          onValueChange={(value) => setFilterUserId(value === 'all' ? undefined : value)}
        >
          <SelectTrigger id="filter-user">
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {allUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {hasActiveFilters && (
        <div className="self-end">
          <Button
            variant="outline"
            onClick={handleClearFilters}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default IdeaFilters;
