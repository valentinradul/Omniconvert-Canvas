
import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserMenu } from '@/components/UserMenu';
import { CompanySwitcher } from '@/components/company/CompanySwitcher';
import { 
  Lightbulb, 
  TestTube, 
  FlaskConical, 
  BarChart3, 
  Building2, 
  Users, 
  Settings,
  Shield,
  Folder
} from 'lucide-react';
import { Logo } from '@/components/Logo';

const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const { isSuperAdmin } = useSuperAdmin();
  const location = useLocation();

  if (!user) {
    return null;
  }

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/ideas', label: 'Ideas', icon: Lightbulb },
    { path: '/hypotheses', label: 'Hypotheses', icon: TestTube },
    { path: '/experiments', label: 'Experiments', icon: FlaskConical },
  ];

  const settingsItems = [
    { path: '/departments', label: 'Departments', icon: Building2 },
    { path: '/categories', label: 'Categories', icon: Folder },
    { path: '/team-settings', label: 'Team', icon: Users },
    { path: '/account-settings', label: 'Account', icon: Settings },
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="flex h-16 items-center px-4">
          <Logo />
          <div className="mx-6 hidden md:flex">
            <CompanySwitcher />
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-muted/10 min-h-[calc(100vh-4rem)]">
          <div className="space-y-4 py-4">
            {/* Main Navigation */}
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                Growth Lab
              </h2>
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.path}
                      variant={isActivePath(item.path) ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      asChild
                    >
                      <Link to={item.path}>
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Settings */}
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                Settings
              </h2>
              <div className="space-y-1">
                {settingsItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.path}
                      variant={isActivePath(item.path) ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      asChild
                    >
                      <Link to={item.path}>
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Super Admin Section */}
            {isSuperAdmin && (
              <>
                <Separator />
                <div className="px-3 py-2">
                  <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-primary">
                    Super Admin
                  </h2>
                  <div className="space-y-1">
                    <Button
                      variant={isActivePath('/super-admin') ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      asChild
                    >
                      <Link to="/super-admin">
                        <Shield className="mr-2 h-4 w-4" />
                        System Management
                      </Link>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
