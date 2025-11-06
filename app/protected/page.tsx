import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/currency";
import { ShoppingCart, Package, Users, DollarSign, Plus, Eye, Edit } from "lucide-react";
import Link from "next/link";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Fetch today's sales data
  const today = new Date().toISOString().split('T')[0];
  const { data: todaySales } = await supabase
    .from('sales')
    .select('total_price')
    .gte('created_at', today)
    .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);

  // Fetch total sales count for today
  const { count: todaySalesCount } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today)
    .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);

  // Fetch total products
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  // Fetch total customers
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  // Fetch recent sales
  const { data: recentSales } = await supabase
    .from('sales')
    .select(`
      id,
      total_price,
      created_at,
      customers(name)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch low stock products (products with quantity type)
  const { data: lowStockProducts } = await supabase
    .from('products')
    .select('*')
    .eq('type', 'quantity')
    .order('created_at', { ascending: false })
    .limit(5);

  const todayTotal = todaySales?.reduce((sum, sale) => sum + parseFloat(sale.total_price), 0) || 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Welcome back! Here's your business overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Today's Sales</h3>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{formatRupiah(todayTotal)}</div>
          <p className="text-xs text-muted-foreground">Total revenue today</p>
        </div>
        
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Today's Orders</h3>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{todaySalesCount || 0}</div>
          <p className="text-xs text-muted-foreground">Orders today</p>
        </div>
        
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Products</h3>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{totalProducts || 0}</div>
          <p className="text-xs text-muted-foreground">In inventory</p>
        </div>
        
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Customers</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{totalCustomers || 0}</div>
          <p className="text-xs text-muted-foreground">Total customers</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link 
            href="/sales/new"
            className="flex items-center justify-center rounded-lg bg-primary text-primary-foreground p-4 hover:bg-primary/90 transition-colors font-medium"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            New Sale
          </Link>
          <Link 
            href="/products"
            className="flex items-center justify-center rounded-lg border border-input bg-background p-4 hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
          >
            <Package className="mr-2 h-5 w-5" />
            Manage Products
          </Link>
          <Link 
            href="/customers"
            className="flex items-center justify-center rounded-lg border border-input bg-background p-4 hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
          >
            <Users className="mr-2 h-5 w-5" />
            View Customers
          </Link>
          <Link 
            href="/sales"
            className="flex items-center justify-center rounded-lg border border-input bg-background p-4 hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
          >
            <Eye className="mr-2 h-5 w-5" />
            Sales History
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Sales</h2>
            <Link 
              href="/sales"
              className="text-sm text-primary hover:underline flex items-center"
            >
              View all
              <Eye className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentSales && recentSales.length > 0 ? (
              recentSales.map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Sale #{sale.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {sale.customers?.name || 'Walk-in Customer'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatRupiah(sale.total_price)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No sales yet today</p>
            )}
          </div>
        </div>

        {/* Recent Products */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Products</h2>
            <Link 
              href="/products"
              className="text-sm text-primary hover:underline flex items-center"
            >
              Manage
              <Edit className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {lowStockProducts && lowStockProducts.length > 0 ? (
              lowStockProducts.map((product: any) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{product.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRupiah(product.price_per_unit)} per {product.type === 'size' ? 'm²' : 'unit'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {product.type === 'size' ? 'Size-based' : 'Quantity-based'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No products added yet</p>
            )}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <div className="text-sm">
          <p><strong>Email:</strong> {data.claims.email || 'N/A'}</p>
          <p><strong>User ID:</strong> {data.claims.sub || 'N/A'}</p>
          <p><strong>Last Sign In:</strong> {new Date(data.claims.iat * 1000).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
