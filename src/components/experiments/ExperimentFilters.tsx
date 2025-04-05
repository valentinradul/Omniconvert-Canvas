
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_STATUSES } from '@/types';

interface ExperimentFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: string | undefined;
  setFilterStatus: (status: string | undefined) => void;
  filterResponsible: string | undefined;
  setFilterResponsible: (userId: string | undefined) => void;
  allUsers: { id: string; name: string }[];
}

const ExperimentFilters: React.FC<ExperimentFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterResponsible,
  setFilterResponsible,
  allUsers,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-2/3">
        <Input
          placeholder="Search experiments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="flex gap-2 w-full md:w-1/3">
        <div className="w-1/2">
          <Select 
            value={filterStatus || "all"} 
            onValueChange={(value) => setFilterStatus(value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ALL_STATUSES.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-1/2">
          <Select 
            value={filterResponsible || "all"} 
            onValueChange={(value) => setFilterResponsible(value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Responsible" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {allUsers.map(user => (
                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ExperimentFilters;
