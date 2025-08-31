import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface CRMLayoutProps {
  children: React.ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <header className="h-16 flex items-center border-b border-glass-border/60 px-6 bg-glass/30 backdrop-blur-sm">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1" />
          </header>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}