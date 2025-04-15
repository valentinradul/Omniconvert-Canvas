
import React, { useState } from 'react';
import { useCompany } from '@/context/company/CompanyContext';
import { Check, ChevronsUpDown, PlusCircle, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import CreateCompanyDialog from './CreateCompanyDialog';

const CompanySwitcher: React.FC = () => {
  const { companies, currentCompany, switchCompany } = useCompany();
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleSelect = (companyId: string) => {
    switchCompany(companyId);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a company"
            className="w-[200px] justify-between"
          >
            <Building className="mr-2 h-4 w-4" />
            {currentCompany?.name || "Select company"}
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search company..." />
              <CommandEmpty>No company found.</CommandEmpty>
              {companies.length > 0 && (
                <CommandGroup heading="Your Companies">
                  {companies.map((company) => (
                    <CommandItem
                      key={company.id}
                      onSelect={() => handleSelect(company.id)}
                      className="cursor-pointer"
                    >
                      <Building className="mr-2 h-4 w-4" />
                      {company.name}
                      {currentCompany?.id === company.id && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  setShowCreateDialog(true);
                }}
                className="cursor-pointer"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Company
              </CommandItem>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <CreateCompanyDialog 
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </>
  );
};

export default CompanySwitcher;
