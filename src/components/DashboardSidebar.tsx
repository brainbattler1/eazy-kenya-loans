import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  CreditCard, 
  FileText, 
  MessageSquare, 
  UserPlus,
  Home,
  Shield
} from "lucide-react";
import { useAdminCheck } from "@/hooks/useAdminCheck";

export function DashboardSidebar() {
  const location = useLocation();
  const { isAdmin } = useAdminCheck();

  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;

  const mainMenuItems = [
    { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
    { title: "Loan Applications", url: "/apply", icon: FileText },
    { title: "My Loans", url: "/loans", icon: CreditCard },
    { title: "Support", url: "/support", icon: MessageSquare },
    { title: "Referrals", url: "/referrals", icon: UserPlus },
  ];

  const adminMenuItems = [
    { title: "Admin Panel", url: "/admin", icon: Shield },
  ];

  const getNavClassName = (isActive: boolean) =>
    isActive
      ? "bg-primary text-primary-foreground shadow-premium"
      : "hover:bg-accent hover:text-accent-foreground transition-all duration-200";

  return (
    <Sidebar className="w-64 bg-gradient-card border-r shadow-card">
      <SidebarContent className="p-4">
        {/* Logo Section */}
        <div className="flex items-center space-x-3 mb-8 p-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-premium flex items-center justify-center shadow-glow">
            <span className="text-primary-foreground font-bold text-xl">E</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Eazy Loan</h1>
            <p className="text-xs text-muted-foreground">Premium Banking</p>
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold mb-4">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${getNavClassName(isActive(item.url))}`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-semibold mb-4">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${getNavClassName(isActive(item.url))}`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Back to Home */}
        <div className="mt-auto pt-8">
          <SidebarMenuButton asChild>
            <NavLink
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              <Home className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">Back to Home</span>
            </NavLink>
          </SidebarMenuButton>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}