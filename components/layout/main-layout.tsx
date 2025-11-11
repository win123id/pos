"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Footer } from "./footer";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  
  // Don't show header and footer for auth routes
  const isAuthRoute = pathname?.startsWith("/auth");
  
  return (
    <div className="min-h-screen flex flex-col">
      {!isAuthRoute && <Header />}
      <main className="flex-1 bg-muted/30">
        <div className="container py-8 px-6">
          {children}
        </div>
      </main>
      {!isAuthRoute && <Footer />}
    </div>
  );
}
