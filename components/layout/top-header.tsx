"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Sidebar, PanelLeftClose } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";

interface TopHeaderProps {
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function TopHeader({ isSidebarCollapsed = false, onToggleSidebar }: TopHeaderProps) {
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <header className="w-full bg-muted/30 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left side - sidebar toggle */}
        <div className={cn(
          "flex items-center gap-2 transition-all duration-300 ease-in-out hidden lg:flex",
          isSidebarCollapsed ? "pl-16" : "pl-64"
        )}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="text-muted-foreground hover:text-foreground"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <Sidebar className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Right side - theme switcher and sign out */}
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="sm:hidden text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
