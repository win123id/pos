"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function TopHeader({ isSidebarCollapsed = false, onToggleSidebar }: TopHeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      setAvatarUrl(profile?.avatar_url ?? null);
      setDisplayName(profile?.full_name ?? user.email ?? null);
    };

    loadProfile();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <header className="w-full bg-muted/30 backdrop-blur-sm">
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
                className="flex items-center gap-2 rounded-full border border-border bg-muted px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium">
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
