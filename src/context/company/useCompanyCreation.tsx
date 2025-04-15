
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { createCompanyAPI } from './utils/companyCreator';
import { Company } from '@/types';

export const useCompanyCreation = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const createCompany = async (name: string, userId: string | undefined) => {
    if (!userId) {
      const errorMessage = 'Authentication required: You must be logged in to create a company.';
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: errorMessage,
      });
      throw new Error(errorMessage);
    }
    
    setIsCreating(true);
    
    try {
      const newCompany = await createCompanyAPI(name, userId);
      
      toast({
        title: 'Company created',
        description: `${name} has been created successfully.`,
      });
      
      return newCompany;
    } catch (error: any) {
      console.error('Error creating company:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to create company',
        description: error.message,
      });
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createCompany,
    isCreating
  };
};
