"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronDown, LogOut, Sidebar, PanelLeftClose } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface TopHeaderProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onSignOut?: () => Promise<void> | void;
}

export function TopHeader({
  avatarUrl = null,
  displayName = null,
  isSidebarCollapsed = false,
  onToggleSidebar,
  onSignOut,
}: TopHeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await onSignOut?.();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/35 bg-background/70 backdrop-blur-md">
      <div
        className={cn(
          "flex h-16 items-center gap-3 px-4 lg:px-8 transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
        )}
      >
        {/* Left side - sidebar toggle */}
        <div className="hidden items-center gap-2 lg:flex">
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
        
        {/* Right side - theme switcher and avatar dropdown */}
        <div className="ml-auto flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-2 py-1 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-accent text-xs font-medium">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName || "Avatar"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>
                      {(displayName || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="hidden max-w-32 truncate text-sm lg:inline-block">
                  {displayName || "User"}
                </span>
                <ChevronDown className="hidden h-4 w-4 text-muted-foreground lg:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="flex flex-col">
                <span className="text-xs text-muted-foreground">Signed in as</span>
                <span className="truncate text-sm font-medium">{displayName || "User"}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <span>Theme</span>
                  <ThemeSwitcher />
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  router.push("/profiles");
                }}
              >
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  router.push("/auth/update-password");
                }}
              >
                Change password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  handleSignOut();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
