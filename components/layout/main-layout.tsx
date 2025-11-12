"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopHeader } from "./top-header";


interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSidebarCollapseChange = (isCollapsed: boolean) => {
    setIsSidebarCollapsed(isCollapsed);
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar 
            isCollapsed={isSidebarCollapsed}
            onCollapseChange={handleSidebarCollapseChange}
          />
      <div className="flex-1 flex flex-col">
        <TopHeader 
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
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
