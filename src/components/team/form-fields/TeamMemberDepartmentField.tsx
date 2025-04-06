
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeamMemberFormData } from '@/types';
import { Department } from '@/types';

interface TeamMemberDepartmentFieldProps {
  control: Control<TeamMemberFormData>;
  departments: Department[];
}

export const TeamMemberDepartmentField: React.FC<TeamMemberDepartmentFieldProps> = ({ 
  control,
  departments 
}) => {
  return (
    <FormField
      control={control}
      name="department"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Department</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
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
