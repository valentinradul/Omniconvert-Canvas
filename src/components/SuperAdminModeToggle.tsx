import React from 'react';
import { Shield, Users, Check } from 'lucide-react';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SuperAdminModeToggle: React.FC = () => {
  const { isSuperAdmin, operatingMode, switchOperatingMode } = useSuperAdmin();
const [mode,setMode]=useState(false)
  if (!isSuperAdmin) {
    return null;
  

    useEffect(()=>{

      
    },[mode])
    

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Operating Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={operatingMode === 'superadmin' ? 'default' : 'outline'}
            onClick={() => {switchOperatingMode('superadmin') setMode(true)}}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <Shield className="h-5 w-5" />
            <span className="text-sm">Super Admin</span>
            {operatingMode === 'superadmin' && (
              <Check className="h-4 w-4 text-green-500" />
            )}
          </Button>
          
          <Button
            variant={operatingMode === 'normal' ? 'default' : 'outline'}
            onClick={() => switchOperatingMode('normal')}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <Users className="h-5 w-5" />
            <span className="text-sm">Normal User</span>
            {operatingMode === 'normal' && (
              <Check className="h-4 w-4 text-green-500" />
            )}
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {operatingMode === 'superadmin' ? (
            <p>Operating with full super admin privileges across all companies</p>
          ) : (
            <p>Operating as a normal user with access to your company memberships</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SuperAdminModeToggle;