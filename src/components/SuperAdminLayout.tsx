
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
  Building, 
  Users, 
  FolderTree,
  Shield,
  FlaskConical,
  Lightbulb
} from 'lucide-react';

// Add custom CSS to force white background for sidebar
const sidebarStyles = document.createElement('style');
sidebarStyles.innerHTML = `
  [data-sidebar="sidebar"] {
    background-color: white !important;
  }
`;
document.head.appendChild(sidebarStyles);

const SuperAdminLayout: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="z-10 border-r border-gray-200 !bg-white">
          <SidebarContent className="!bg-white">
            <div className="py-6 px-4 border-b border-gray-200 bg-white">
              <Logo className="flex items-center" />
              <p className="text-xs text-red-600 mt-1 font-semibold">Super Admin Panel</p>
            </div>
            <SidebarMenu className="py-4 bg-white">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  className={`flex items-center py-3 px-4 ${isActive('/super-admin/companies') 
                    ? 'bg-red-50 text-red-600 border-l-4 border-red-500 font-medium' 
                    : 'bg-white text-gray-800 hover:bg-red-50 hover:text-red-700'}`}
                >
                  <Link to="/super-admin/companies" className="flex items-center">
                    <Building className="h-5 w-5 mr-3" strokeWidth={1.5} />
                    <span className="text-base">Companies</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  className={`flex items-center py-3 px-4 ${isActive('/super-admin/members') 
                    ? 'bg-red-50 text-red-600 border-l-4 border-red-500 font-medium' 
                    : 'bg-white text-gray-800 hover:bg-red-50 hover:text-red-700'}`}
                >
                  <Link to="/super-admin/members" className="flex items-center">
                    <Users className="h-5 w-5 mr-3" strokeWidth={1.5} />
                    <span className="text-base">Members</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  className={`flex items-center py-3 px-4 ${isActive('/super-admin/departments') 
                    ? 'bg-red-50 text-red-600 border-l-4 border-red-500 font-medium' 
                    : 'bg-white text-gray-800 hover:bg-red-50 hover:text-red-700'}`}
                >
                  <Link to="/super-admin/departments" className="flex items-center">
                    <FolderTree className="h-5 w-5 mr-3" strokeWidth={1.5} />
                    <span className="text-base">Departments</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  className={`flex items-center py-3 px-4 ${isActive('/super-admin/ideas') 
                    ? 'bg-red-50 text-red-600 border-l-4 border-red-500 font-medium' 
                    : 'bg-white text-gray-800 hover:bg-red-50 hover:text-red-700'}`}
                >
                  <Link to="/super-admin/ideas" className="flex items-center">
                    <Lightbulb className="h-5 w-5 mr-3" strokeWidth={1.5} />
                    <span className="text-base">Ideas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  className={`flex items-center py-3 px-4 ${isActive('/super-admin/experiments') 
                    ? 'bg-red-50 text-red-600 border-l-4 border-red-500 font-medium' 
                    : 'bg-white text-gray-800 hover:bg-red-50 hover:text-red-700'}`}
                >
                  <Link to="/super-admin/experiments" className="flex items-center">
                    <FlaskConical className="h-5 w-5 mr-3" strokeWidth={1.5} />
                    <span className="text-base">Experiments</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto bg-white">
          {isAuthenticated && (
            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-red-600" />
                <h1 className="text-xl font-bold text-gray-900">Super Admin Panel</h1>
              </div>
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

export default SuperAdminLayout;
