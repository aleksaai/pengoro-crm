import { BarChart3, Users, CheckSquare, RotateCcw, TrendingUp, UserCheck, Info, Shield } from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import pengoroLogo from "@/assets/pengoro-logo.png";

const navItems = [
  { title: "Customers", url: "/customers", icon: UserCheck },
  { title: "Pipeline", url: "/", icon: BarChart3 },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Winbacks", url: "/winbacks", icon: RotateCcw },
  { title: "Analytics", url: "/analytics", icon: TrendingUp },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { accountType } = useAuth();
  const isAdmin = accountType === "super_admin" || accountType === "admin";

  const allNavItems = isAdmin
    ? [...navItems, { title: "Admin", url: "/admin", icon: Shield }]
    : navItems;

  return (
    <Sidebar collapsible="icon" className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <SidebarHeader className={`relative border-b border-glass-border/40 ${isCollapsed ? 'p-3' : 'p-6'} bg-gradient-to-br from-primary/5 via-background to-accent/5`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-5'} relative z-10`}>
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-50 transition duration-300"></div>
            <img 
              src={pengoroLogo} 
              alt="Pengoro UG logo" 
              className={`relative ${isCollapsed ? 'w-10 h-10' : 'w-14 h-14'} rounded-2xl shadow-xl border border-glass-border/30 bg-background/50 backdrop-blur-sm`}
            />
          </div>
          {!isCollapsed && (
            <div className="space-y-2">
              <h2 className="font-display font-bold text-2xl text-foreground tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Pengoro UG
              </h2>
              <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-[0.2em] border-l-2 border-primary/30 pl-3">
                Magic CRM
              </p>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-glass/10 to-transparent"></div>
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {allNavItems.map((item, index) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      size="lg"
                      className={`
                        rounded-xl transition-all duration-300 relative overflow-hidden group
                        ${isActive 
                          ? 'bg-primary text-primary-foreground font-semibold shadow-lg' 
                          : 'hover:bg-accent/80 hover:text-accent-foreground hover:shadow-md'
                        }
                      `}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <NavLink to={item.url} className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-4 px-5'}`}>
                        <item.icon className={`w-6 h-6 transition-all duration-300 ${isActive ? 'drop-shadow-sm' : 'group-hover:scale-110'}`} />
                        {!isCollapsed && <span className="font-display font-medium text-base tracking-wide">{item.title}</span>}
                        {isActive && !isCollapsed && (
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

        {/* AI Update Info */}
        <div className="mt-auto p-4">
          <TooltipProvider>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-center">
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-3 border border-primary/20 cursor-pointer hover:from-primary/20 hover:to-accent/20 transition-all duration-300">
                      <Info className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Coming Soon</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Major AI Update will be available soon
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-3 border border-primary/20">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse mt-1.5"></div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-foreground">Coming Soon</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Major AI Update will be available soon
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TooltipProvider>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}