export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container py-8 text-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="POS Logo" 
              className="h-8 w-auto"
            />
            <span className="font-bold text-lg">POS System</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Modern point-of-sale system built with Next.js and Supabase for seamless business management.
          </p>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          © {year} POS System. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
