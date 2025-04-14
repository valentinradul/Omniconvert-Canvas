
import React from 'react';
import { Input } from '@/components/ui/input';

interface DashboardSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const DashboardSearch: React.FC<DashboardSearchProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="bg-white rounded-lg border mb-4">
      <div className="p-4">
        <Input
          placeholder="Search ideas, hypotheses, or experiments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xl"
        />
      </div>
    </div>
  );
};

export default DashboardSearch;
