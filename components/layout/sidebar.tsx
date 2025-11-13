"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Home, 
  LogOut, 
  TrendingDown,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, adminOnly: true },
  { name: "Sales", href: "/sales", icon: ShoppingCart, adminOnly: true },
  { name: "Products", href: "/products", icon: Package, adminOnly: true },
  { name: "Customers", href: "/customers", icon: Users, adminOnly: true },
  { name: "COGS", href: "/cogs", icon: TrendingDown, adminOnly: true },
  { name: "Users", href: "/users", icon: UserCog, adminOnly: true },
];

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

export function Sidebar({ className, isCollapsed = false, onCollapseChange }: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    onCollapseChange?.(newCollapsedState);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setUserRole(profile?.role || 'user');
      }
    };

    fetchUserRole();
  }, [supabase]);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMobile}
          className="bg-background/95 backdrop-blur-sm shadow-md"
        >
          {isMobileOpen ? <X className="h-4 w-4 mr-2" /> : <Menu className="h-4 w-4 mr-2" />}
          {isMobileOpen ? 'Close' : 'Menu'}
        </Button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 h-screen bg-background border-r transition-all duration-300 ease-in-out flex-shrink-0",
        isCollapsed ? "w-16" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        className
      )}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            {!isCollapsed && (
              <Link href="/" className="flex items-center gap-2 group">
                <img
                  src="/logo.png"
                  alt="POS Logo"
                  className="h-8 w-auto transition-transform duration-300 group-hover:scale-110"
                />
                <span className="text-lg font-semibold tracking-wide bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                  POS System
                </span>
              </Link>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {navigation.filter((item) => !item.adminOnly || userRole === 'admin').map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="truncate">{item.name}</span>
                        {isActive && (
                          <Badge variant="secondary" className="ml-auto">
                            Active
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer with Sign Out */}
          <div className="border-t border-border p-4">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className={cn(
                "w-full justify-start text-muted-foreground hover:text-foreground transition-all",
                isCollapsed && "justify-center px-2"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
