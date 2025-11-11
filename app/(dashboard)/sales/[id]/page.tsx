"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/currency";
import { ArrowLeft, Calendar, User, Package, FileText } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/header";

interface Sale {
  id: number;
  total_price: number;
  created_at: string;
  customer_id?: number | null;
  customers?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  } | null;
  sale_items?: {
    id: number;
    quantity?: number;
    width?: number;
    height?: number;
    item_total: number;
    description?: string;
    products?: {
      name: string;
      type: 'size' | 'quantity';
    } | null;
  }[] | null;
}

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSaleDetail();
  }, [params.id]);

  const fetchSaleDetail = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customers(name, email, phone, address),
          sale_items(
            *,
            products(name, type)
          )
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;
      
      setSale(data);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch sale details');
      console.error('Sale detail error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/sales"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sales
          </Link>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Loading sale details...
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/sales"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sales
          </Link>
        </div>
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg text-center">
          {error || 'Sale not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8 px-6 space-y-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/sales"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sales
            </Link>
          </div>
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Sale Details</h1>
        <p className="text-muted-foreground text-lg">
          View complete information for sale #{sale.id}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Sale Information */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Sale Information
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Sale ID</p>
                <p className="font-medium text-lg">#{sale.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {new Date(sale.created_at).toLocaleDateString('id-ID')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.created_at).toLocaleTimeString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </h2>
            {sale.customers ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="font-medium text-lg">{sale.customers.name}</p>
                </div>
                {sale.customers.email && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-medium">{sale.customers.email}</p>
                  </div>
                )}
                {sale.customers.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <p className="font-medium">{sale.customers.phone}</p>
                  </div>
                )}
                {sale.customers.address && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Address</p>
                    <p className="font-medium">{sale.customers.address}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Walk-in Customer</p>
            )}
          </div>

          {/* Sale Items */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Sale Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Details</th>
                    <th className="text-right p-3 font-medium">Unit Price</th>
                    <th className="text-right p-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.sale_items?.map((item: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-3 font-medium">{item.products.name}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                          {item.products.type === 'size' ? 'Size-based' : 'Quantity-based'}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        {item.products.type === 'quantity' ? (
                          `Quantity: ${item.quantity}`
                        ) : (
                          `${item.width}cm × ${item.height}cm`
                        )}
                        {item.description && (
                          <div className="text-muted-foreground mt-1">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {formatRupiah(item.price_per_unit)}/{item.products.type === 'size' ? 'cm²' : 'unit'}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {formatRupiah(item.item_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-8">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatRupiah(sale.total_price)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-4 border-t">
                <span>Total Amount:</span>
                <span className="text-primary">{formatRupiah(sale.total_price)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
      </main>
    </div>
  );
}
