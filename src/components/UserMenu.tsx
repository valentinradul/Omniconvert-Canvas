
import React from 'react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Shield, Users } from 'lucide-react';

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const { isSuperAdmin, operatingMode, switchOperatingMode } = useSuperAdmin();

  useEffect(()=>{

    
  },[switchOperatingMode])

  if (!user) {
    return null;
  }

  // Use user metadata or fallback to email for display
  const fullName = user.user_metadata?.full_name || '';
  
  // Generate initials for avatar
  const getInitials = () => {
    if (!fullName) return user.email?.[0]?.toUpperCase() || '?';
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 hover:opacity-80">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden md:inline-block">
            {fullName || user.email?.split('@')[0]}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account-settings">Account Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/team-settings">Team Settings</Link>
        </DropdownMenuItem>
        {isSuperAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Super Admin</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => switchOperatingMode('superadmin')}>
              <Shield className="h-4 w-4 mr-2" />
              Super Admin Mode
              {operatingMode === 'superadmin' && <span className="ml-auto text-xs">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => switchOperatingMode('normal')}>
              <Users className="h-4 w-4 mr-2" />
              Normal User Mode
              {operatingMode === 'normal' && <span className="ml-auto text-xs">✓</span>}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
