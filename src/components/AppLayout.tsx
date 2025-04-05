
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="z-10">
          <SidebarContent>
            <div className="py-4 px-3 border-b border-sidebar-border">
              <Logo className="flex items-center" />
              <p className="text-xs text-sidebar-foreground/70">Growth experimentation platform</p>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={isActive('/dashboard') ? 'bg-sidebar-accent' : ''}>
                  <Link to="/dashboard">
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={isActive('/ideas') ? 'bg-sidebar-accent' : ''}>
                  <Link to="/ideas">
                    <span>Growth Ideas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={isActive('/hypotheses') ? 'bg-sidebar-accent' : ''}>
                  <Link to="/hypotheses">
                    <span>Hypotheses</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={isActive('/experiments') ? 'bg-sidebar-accent' : ''}>
                  <Link to="/experiments">
                    <span>Experiments</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={isActive('/departments') ? 'bg-sidebar-accent' : ''}>
                  <Link to="/departments">
                    <span>Departments</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          {isAuthenticated && (
            <div className="p-4 border-b flex justify-end">
              <UserMenu />
            </div>
          )}
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
