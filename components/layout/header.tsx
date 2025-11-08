"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Package, Users, Home, LogOut, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/protected", icon: Home },
  { name: "Sales", href: "/sales", icon: ShoppingCart },
  { name: "Products", href: "/products", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "COGS", href: "/cogs", icon: TrendingDown },
];

export function Header() {
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl shadow-lg relative overflow-hidden">
      {/* Animated gradient background layer */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-move pointer-events-none" />

      <div className="container flex h-16 items-center justify-between px-4 relative">
        {/* Minimal Futuristic Logo */}
        <Link href="/protected" className="flex items-center gap-2 group">
          <img
            src="/logo.png"
            alt="POS Logo"
            className="h-9 w-auto transition-transform duration-300 group-hover:scale-110"
          />
          <span className="hidden sm:inline-block text-lg font-semibold tracking-wide bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]">
            POS System
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:scale-105",
                  isActive
                    ? "text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-transparent transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>

          {/* Mobile Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="md:hidden text-muted-foreground hover:text-primary"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-white/10 bg-background/80 backdrop-blur relative">
        <div className="container px-3 py-2 flex overflow-x-auto gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Animated gradient background keyframes */}
      <style jsx global>{`
        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-move {
          background-size: 200% 200%;
          animation: gradientMove 8s ease infinite;
        }
      `}</style>
    </header>
  );
}
