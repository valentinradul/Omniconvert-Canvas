
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCompany } from '@/context/company/CompanyContext';
import { useToast } from '@/hooks/use-toast';

interface MemberPermission {
  userId: string;
  userName: string;
  role: string;
  canViewAllDepartments: boolean;
}

const MemberPermissionsManager: React.FC = () => {
  const [memberPermissions, setMemberPermissions] = useState<MemberPermission[]>([]);
  const { companyMembers, currentCompany } = useCompany();
  const { toast } = useToast();

  useEffect(() => {
    if (companyMembers && currentCompany) {
      const permissions = companyMembers
        .filter(member => member.role === 'member') // Only show regular members
        .map(member => {
          const storageKey = `adminGrantedViewAll_${member.user_id}_${currentCompany.id}`;
          const hasPermission = localStorage.getItem(storageKey) === 'true';
          
          return {
            userId: member.user_id,
            userName: member.profiles?.full_name || 'Unknown User',
            role: member.role,
            canViewAllDepartments: hasPermission
          };
        });
      
      setMemberPermissions(permissions);
    }
  }, [companyMembers, currentCompany]);

  const toggleMemberPermission = (userId: string, currentPermission: boolean) => {
    if (!currentCompany) return;

    const newPermission = !currentPermission;
    const storageKey = `adminGrantedViewAll_${userId}_${currentCompany.id}`;
    
    if (newPermission) {
      localStorage.setItem(storageKey, 'true');
    } else {
      localStorage.removeItem(storageKey);
    }

    setMemberPermissions(prev => 
      prev.map(member => 
        member.userId === userId 
          ? { ...member, canViewAllDepartments: newPermission }
          : member
      )
    );

    const memberName = memberPermissions.find(m => m.userId === userId)?.userName || 'Member';
    toast({
      title: 'Permission Updated',
      description: `${memberName} ${newPermission ? 'can now' : 'can no longer'} view all departments`,
    });
  };

  if (memberPermissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Member Department Access</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No regular members to manage permissions for.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Department Access</CardTitle>
        <p className="text-sm text-muted-foreground">
          Control which members can view ideas and experiments from all departments
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {memberPermissions.map(member => (
            <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{member.userName}</div>
                <div className="text-sm text-muted-foreground">
                  {member.canViewAllDepartments ? 'Can view all departments' : 'Limited to assigned departments'}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`member-${member.userId}`}
                  checked={member.canViewAllDepartments}
                  onCheckedChange={() => toggleMemberPermission(member.userId, member.canViewAllDepartments)}
                />
                <Label htmlFor={`member-${member.userId}`} className="text-sm">
                  View all departments
                </Label>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberPermissionsManager;
