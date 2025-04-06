
import React from 'react';
import { useCompanyContext } from '@/context/CompanyContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Users, ChevronDown, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CompanySelector: React.FC = () => {
  const { companies, activeCompany, switchCompany } = useCompanyContext();
  const navigate = useNavigate();

  if (!activeCompany) {
    return (
      <Button 
        variant="outline" 
        className="gap-2"
        onClick={() => navigate('/onboarding/company')}
      >
        <Users className="w-4 h-4" />
        Create Company
      </Button>
    );
  }

  const handleCreateCompany = () => {
    navigate('/onboarding/company');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Users className="w-4 h-4" />
          {activeCompany?.name}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Your Companies</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.map(company => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => switchCompany(company.id)}
            className={activeCompany?.id === company.id ? 'bg-muted' : ''}
          >
            {company.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateCompany}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Company
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
