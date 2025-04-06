
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeamMemberFormData, ALL_COMPANY_ROLES } from '@/types';

interface TeamMemberRoleFieldProps {
  control: Control<TeamMemberFormData>;
}

export const TeamMemberRoleField: React.FC<TeamMemberRoleFieldProps> = ({ control }) => {
  return (
    <FormField
      control={control}
      name="role"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Role</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem key="owner" value="owner">
                Admin (full access)
              </SelectItem>
              <SelectItem key="manager" value="manager">
                Manager (can edit all experiments)
              </SelectItem>
              <SelectItem key="member" value="member">
                Member (standard access)
              </SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
