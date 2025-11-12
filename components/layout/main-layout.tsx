import { Sidebar } from "./sidebar";
import { Footer } from "./footer";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 bg-muted/30">
          <div className="container py-8 px-6 lg:px-8 ml-0 lg:ml-16">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
