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
    <Sidebar className="glass-strong border-r border-glass-border/80 backdrop-blur-xl">
      <SidebarHeader className="p-8 border-b border-glass-border/60">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src={pengoroLogo} 
              alt="Pengoro" 
              className="w-12 h-12 rounded-xl shadow-lg"
            />
            
          </div>
          <div className="space-y-1">
            <h2 className="font-display font-bold text-xl text-foreground">
              Pengoro
            </h2>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              CRM System
            </p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className={`
                        h-14 rounded-xl transition-all duration-300 relative overflow-hidden group
                        ${isActive 
                          ? 'bg-primary text-primary-foreground font-semibold shadow-lg' 
                          : 'hover:bg-accent/80 hover:text-accent-foreground hover:shadow-md'
                        }
                      `}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <NavLink to={item.url} className="flex items-center gap-4 px-5">
                        <item.icon className={`w-6 h-6 transition-all duration-300 ${isActive ? 'drop-shadow-sm' : 'group-hover:scale-110'}`} />
                        <span className="font-display font-medium text-base tracking-wide">{item.title}</span>
                        {isActive && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground/30 rounded-l-full"></div>
                        )}
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