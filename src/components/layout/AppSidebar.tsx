import { BarChart3, Users, CheckSquare } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import pengoroLogo from "@/assets/pengoro-logo.png";

const navItems = [
  { title: "Pipeline", url: "/", icon: BarChart3 },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar className="glass-strong border-r border-glass-border">
      <SidebarHeader className="p-6 border-b border-glass-border">
        <div className="flex items-center gap-3">
          <img 
            src={pengoroLogo} 
            alt="Pengoro" 
            className="w-10 h-10 rounded-lg"
          />
          <div>
            <h2 className="font-semibold text-lg text-foreground">Pengoro</h2>
            <p className="text-sm text-muted-foreground">CRM System</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className={`
                        h-12 rounded-lg transition-all duration-200
                        ${isActive 
                          ? 'bg-primary text-primary-foreground font-medium shadow-sm' 
                          : 'hover:bg-accent hover:text-accent-foreground'
                        }
                      `}
                    >
                      <NavLink to={item.url} className="flex items-center gap-3 px-4">
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}