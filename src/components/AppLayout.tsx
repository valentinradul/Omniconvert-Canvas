
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

const AppLayout: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="z-10">
          <SidebarContent>
            <div className="py-4 px-3 border-b border-sidebar-border">
              <h1 className="text-xl font-bold text-sidebar-foreground">ExperimentFlow</h1>
              <p className="text-xs text-sidebar-foreground/70">Growth experimentation platform</p>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={isActive('/') ? 'bg-sidebar-accent' : ''}>
                  <Link to="/">
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

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
