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
  Settings, 
  Users, 
  Beaker,
  Building,
  FolderTree
} from 'lucide-react';

// Add custom CSS to force white background for sidebar
const sidebarStyles = document.createElement('style');
sidebarStyles.innerHTML = `
  [data-sidebar="sidebar"] {
    background-color: white !important;
  }
`;
document.head.appendChild(sidebarStyles);

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Ideas', href: '/ideas', icon: Lightbulb },
  { name: 'Hypotheses', href: '/hypotheses', icon: FlaskConical },
  { name: 'Experiments', href: '/experiments', icon: Beaker },
  { name: 'Departments', href: '/departments', icon: Building },
  { name: 'Categories', href: '/categories', icon: FolderTree },
  { name: 'Settings', href: '/team-settings', icon: Settings }
];

const AppLayout: React.FC = () => {
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
              <p className="text-xs text-gray-600 mt-1">Growth experimentation platform</p>
            </div>
            <SidebarMenu className="py-4 bg-white">
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    asChild 
                    className={`flex items-center py-3 px-4 ${isActive(item.href) 
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500 font-medium' 
                      : 'bg-white text-gray-800 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    <Link to={item.href} className="flex items-center">
                      <item.icon className="h-5 w-5 mr-3" strokeWidth={1.5} />
                      <span className="text-base">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto bg-white">
          {isAuthenticated && (
            <div className="p-4 border-b border-gray-200 bg-white flex justify-end">
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
