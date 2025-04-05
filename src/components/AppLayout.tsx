
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton 
} from '@/components/ui/sidebar';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import { 
  LayoutDashboard, 
  FlaskConical, 
  Lightbulb, 
  LineChart, 
  Building, 
  Settings, 
  Users, 
  ChevronRight 
} from 'lucide-react';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="z-10 border-r border-sidebar-border bg-white">
          <SidebarContent>
            <div className="py-6 px-4 border-b border-gray-200">
              <Logo className="flex items-center" />
              <p className="text-xs text-gray-500 mt-1">Growth experimentation platform</p>
            </div>
            <SidebarMenu className="py-4">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  className={`flex items-center py-3 px-4 ${isActive('/dashboard') 
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Link to="/dashboard" className="flex items-center">
                    <LayoutDashboard className="h-5 w-5 mr-3" strokeWidth={1.5} />
                    <span className="text-base">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  className={`flex items-center py-3 px-4 ${isActive('/ideas') 
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Link to="/ideas" className="flex items-center">
                    <Lightbulb className="h-5 w-5 mr-3" strokeWidth={1.5} />
                    <span className="text-base">Growth Ideas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  className={`flex items-center py-3 px-4 ${isActive('/hypotheses') 
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Link to="/hypotheses" className="flex items-center">
                    <FlaskConical className="h-5 w-5 mr-3" strokeWidth={1.5} />
                    <span className="text-base">Hypotheses</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  className={`flex items-center py-3 px-4 ${isActive('/experiments') 
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Link to="/experiments" className="flex items-center">
                    <LineChart className="h-5 w-5 mr-3" strokeWidth={1.5} />
                    <span className="text-base">Experiments</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  className={`flex items-center py-3 px-4 ${isActive('/departments') 
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Link to="/departments" className="flex items-center">
                    <Building className="h-5 w-5 mr-3" strokeWidth={1.5} />
                    <span className="text-base">Departments</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    className={`flex items-center py-3 px-4 ${isActive('/team-settings') 
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <Link to="/team-settings" className="flex items-center">
                      <Users className="h-5 w-5 mr-3" strokeWidth={1.5} />
                      <span className="text-base">Team Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    className={`flex items-center py-3 px-4 ${isActive('/account-settings') 
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <Link to="/account-settings" className="flex items-center">
                      <Settings className="h-5 w-5 mr-3" strokeWidth={1.5} />
                      <span className="text-base">Account Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </div>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto bg-gray-50">
          {isAuthenticated && (
            <div className="p-4 border-b bg-white flex justify-end">
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
