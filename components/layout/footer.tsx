import { Github, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="POS Logo" 
                className="h-8 w-auto"
              />
              <span className="font-bold text-lg">POS System</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Modern point-of-sale system built with Next.js and Supabase for seamless business management.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/protected" className="hover:text-foreground transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/sales/new" className="hover:text-foreground transition-colors">
                  New Sale
                </a>
              </li>
              <li>
                <a href="/products" className="hover:text-foreground transition-colors">
                  Products
                </a>
              </li>
              <li>
                <a href="/customers" className="hover:text-foreground transition-colors">
                  Customers
                </a>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Sales Management</li>
              <li>Inventory Tracking</li>
              <li>Customer Database</li>
              <li>Real-time Analytics</li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2024 POS System. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Made with <Heart className="h-3 w-3 text-red-500" /> for your business
              </p>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
