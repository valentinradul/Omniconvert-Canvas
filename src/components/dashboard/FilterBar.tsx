
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FilterX } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  onClearFilters,
  hasActiveFilters
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search ideas, hypotheses, or experiments..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      {hasActiveFilters && (
        <Button 
          variant="outline" 
          onClick={onClearFilters} 
          size="sm" 
          className="flex items-center gap-1.5"
        >
          <FilterX size={16} />
          <span>Clear Filters</span>
        </Button>
      )}
    </div>
  );
};

export default FilterBar;
