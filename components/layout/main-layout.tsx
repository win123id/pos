import { Header } from "./header";
import { Footer } from "./footer";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    
    <div className="min-h-screen flex flex-col">
      
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8 px-6">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
