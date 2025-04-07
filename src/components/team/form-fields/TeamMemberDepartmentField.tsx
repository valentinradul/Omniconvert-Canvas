
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormContext } from "react-hook-form";
import { TeamMemberFormData } from "@/types";

interface TeamMemberDepartmentFieldProps {
  departments: { id: string; name: string }[];
}

const TeamMemberDepartmentField: React.FC<TeamMemberDepartmentFieldProps> = ({ departments }) => {
  const form = useFormContext<TeamMemberFormData>();

  return (
    <FormField
      control={form.control}
      name="department"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Department</FormLabel>
          <FormControl>
            <Select
              onValueChange={(value) => field.onChange(value)}
              value={field.value?.toString() || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TeamMemberDepartmentField;
