import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlobalSearch } from "@/components/ui/global-search";

interface CRMLayoutProps {
  children: React.ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const getUserInitials = (email: string | undefined) => {
    if (!email) return "U";
    const parts = email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email[0].toUpperCase();
  };

  return (
    <SidebarProvider defaultOpen={true} style={{ ["--sidebar-width-icon" as any]: "72px" } as any}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-50 h-16 flex items-center border-b border-glass-border/60 px-6 bg-glass/30 backdrop-blur-sm">
            <SidebarTrigger className="mr-4" />
            
            {/* Global Search */}
            <div className="flex-1 max-w-md mx-4">
              <GlobalSearch />
            </div>
            
            <div className="flex-1" />
            
            {/* User profile dropdown */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.email}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 rounded-full p-0 hover:bg-glass/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {getUserInitials(user?.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-sm border-glass-border/40">
                  <DropdownMenuItem className="cursor-pointer hover:bg-glass/50">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="cursor-pointer hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}