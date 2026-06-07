"use client";

import { IdleLogout } from "@/components/idle-logout";
import { useCurrentProfile } from "@/hooks/use-current-profile";
import { signOutClient } from "@/lib/session/sign-out";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopHeader } from "./top-header";


interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { profile } = useCurrentProfile();

  const handleSidebarCollapseChange = (isCollapsed: boolean) => {
    setIsSidebarCollapsed(isCollapsed);
  };

  const handleSignOut = async () => {
    await signOutClient();
  };

  return (
    <div className="min-h-screen flex">
      <IdleLogout />
      <Sidebar 
             isCollapsed={isSidebarCollapsed}
             userRole={profile?.role ?? null}
             onCollapseChange={handleSidebarCollapseChange}
             onSignOut={handleSignOut}
           />
      <div className="flex-1 flex flex-col">
        <TopHeader 
             isSidebarCollapsed={isSidebarCollapsed}
             avatarUrl={profile?.avatar_url ?? null}
             displayName={profile?.full_name || profile?.email || null}
             onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
             onSignOut={handleSignOut}
           />
        <main className="flex-1 bg-muted/30">
          <div 
            className={`py-8 px-6 lg:px-8 transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? 'lg:ml-16 lg:max-w-[calc(100vw-4rem)]' : 'lg:ml-64 lg:max-w-[calc(100vw-16rem)]'
            } max-w-full mx-auto`}
          >
            {children}
          </div>
        </main>
        
      </div>
    </div>
  );
}
