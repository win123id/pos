import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/currency";
import { ShoppingCart, Package, Users, DollarSign, Plus, Eye, Edit } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function Home() {
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(todayTotal)}</div>
            <p className="text-xs text-muted-foreground">Total revenue today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySalesCount || 0}</div>
            <p className="text-xs text-muted-foreground">Orders today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">Total customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you can perform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild className="h-auto py-4">
              <Link href="/sales/new" className="flex items-center justify-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                New Sale
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4">
              <Link href="/products" className="flex items-center justify-center">
                <Package className="mr-2 h-5 w-5" />
                Manage Products
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4">
              <Link href="/customers" className="flex items-center justify-center">
                <Users className="mr-2 h-5 w-5" />
                View Customers
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4">
              <Link href="/sales" className="flex items-center justify-center">
                <Eye className="mr-2 h-5 w-5" />
                Sales History
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Sales</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sales" className="flex items-center">
                  View all
                  <Eye className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Recent Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Products</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/products" className="flex items-center">
                  Manage
                  <Edit className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>Email:</strong> {data.claims.email || 'N/A'}</p>
            <p><strong>User ID:</strong> {data.claims.sub || 'N/A'}</p>
            <p><strong>Last Sign In:</strong> {new Date(data.claims.iat * 1000).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
