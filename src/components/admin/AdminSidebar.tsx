import { Film, Star, Mail, Users, Home, Menu, BarChart3, Folder, Upload, History, Shield, Database, Eye, Calendar, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Dashboard', url: '/admin', icon: Home },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'Visitors', url: '/admin/visitors', icon: Eye },
  { title: 'Movies', url: '/admin/movies', icon: Film },
  { title: 'Upcoming Trailers', url: '/admin/upcoming', icon: Calendar },
  { title: 'TMDB Import', url: '/admin/tmdb-import', icon: Database },
  { title: 'Categories', url: '/admin/categories', icon: Folder },
  { title: 'Bulk Import', url: '/admin/bulk-import', icon: Upload },
  { title: 'Reviews', url: '/admin/reviews', icon: Star },
  { title: 'Newsletter', url: '/admin/newsletter', icon: Mail },
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'Login History', url: '/admin/login-history', icon: History },
  { title: 'Security', url: '/admin/security', icon: Shield },
  { title: 'General Settings', url: '/admin/general-settings', icon: Settings },
];

export const AdminSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (url: string) => {
    if (url === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </SidebarTrigger>
          {!collapsed && (
            <span className="font-bold text-lg text-primary">Admin Panel</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    onClick={() => navigate(item.url)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer',
                      isActive(item.url)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
