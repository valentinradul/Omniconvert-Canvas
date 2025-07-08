
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Department {
  id: string;
  name: string;
}

interface DepartmentPermissionSelectorProps {
  departments: Department[];
  selectedDepartments: string[];
  onDepartmentChange: (departmentId: string, checked: boolean) => void;
  allDepartmentsSelected: boolean;
  onAllDepartmentsChange: (checked: boolean) => void;
}

const DepartmentPermissionSelector: React.FC<DepartmentPermissionSelectorProps> = ({
  departments,
  selectedDepartments,
  onDepartmentChange,
  allDepartmentsSelected,
  onAllDepartmentsChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Department Access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="all-departments"
            checked={allDepartmentsSelected}
            onCheckedChange={onAllDepartmentsChange}
          />
          <Label htmlFor="all-departments" className="font-medium">
            All Departments
          </Label>
        </div>
        
        {!allDepartmentsSelected && (
          <div className="pl-6 space-y-2 border-l-2 border-gray-100">
            <Label className="text-xs text-muted-foreground">
              Select specific departments:
            </Label>
            {departments.map((department) => (
              <div key={department.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`dept-${department.id}`}
                  checked={selectedDepartments.includes(department.id)}
                  onCheckedChange={(checked) => 
                    onDepartmentChange(department.id, checked as boolean)
                  }
                />
                <Label htmlFor={`dept-${department.id}`} className="text-sm">
                  {department.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DepartmentPermissionSelector;
