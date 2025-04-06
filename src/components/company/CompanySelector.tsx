
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
import { Users, ChevronDown, Plus, Building, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CompanySelectorProps {
  className?: string;
  iconOnly?: boolean;
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({ className = "", iconOnly = false }) => {
  const { companies, activeCompany, switchCompany } = useCompanyContext();
  const navigate = useNavigate();

  if (!activeCompany) {
    return (
      <Button 
        variant="outline" 
        className={`gap-2 ${className}`}
        onClick={() => navigate('/onboarding/company')}
      >
        <Building className="w-4 h-4" />
        {!iconOnly && "Create Company"}
      </Button>
    );
  }

  const handleCreateCompany = () => {
    navigate('/onboarding/company');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`gap-2 ${className}`}>
          {iconOnly ? (
            <Building className="w-4 h-4" />
          ) : (
            <>
              <div className="flex items-center">
                <div className="flex flex-col items-start text-left mr-2">
                  <span className="text-xs text-muted-foreground">Active company</span>
                  <span className="font-medium">{activeCompany?.name}</span>
                </div>
                <ChevronDown className="w-4 h-4 ml-2" />
              </div>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Your Companies</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.map(company => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => switchCompany(company.id)}
            className={`${activeCompany?.id === company.id ? 'bg-muted' : ''} flex items-center py-2`}
          >
            <Building className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{company.name}</span>
            {activeCompany?.id === company.id && 
              <span className="ml-auto text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Active</span>
            }
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/dashboard')} className="flex items-center py-2">
          <Home className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Personal Growth Ideas</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateCompany} className="flex items-center py-2">
          <Plus className="mr-2 h-4 w-4" />
          <span>Create New Company</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
