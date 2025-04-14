
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeamMemberFormData, ALL_TEAM_MEMBER_ROLES } from '@/types';

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
              {ALL_TEAM_MEMBER_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role} {role === 'Admin' && '(full access)'}
                  {role === 'Manager' && '(can edit all experiments)'}
                  {role === 'Team Member' && '(standard access)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
